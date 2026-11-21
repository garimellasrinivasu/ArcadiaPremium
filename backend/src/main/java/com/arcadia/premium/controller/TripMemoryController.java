package com.arcadia.premium.controller;

import com.arcadia.premium.model.TripAlbum;
import com.arcadia.premium.model.TripPhoto;
import com.arcadia.premium.repository.TripAlbumRepository;
import com.arcadia.premium.repository.TripPhotoRepository;
import com.arcadia.premium.service.TripMemoryService;
import com.arcadia.premium.service.TripVideoProcessor;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Trip memories. Public part (no login, /api/trip-memories/public/{slug}/...): view the album and,
 * with the PIN, upload photos. Admin part (/api/trip-memories/...): create albums, set the PIN,
 * write day stories and captions, hide or delete photos.
 */
@RestController
@RequestMapping("/api/trip-memories")
public class TripMemoryController {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final String MANAGE = "hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'TRIP_MEMORIES')";

    private final TripAlbumRepository albums;
    private final TripPhotoRepository photos;
    private final TripMemoryService service;
    private final TripVideoProcessor videos;
    private final ObjectMapper mapper = new ObjectMapper();

    public TripMemoryController(TripAlbumRepository albums, TripPhotoRepository photos, TripMemoryService service, TripVideoProcessor videos) {
        this.albums = albums;
        this.photos = photos;
        this.service = service;
        this.videos = videos;
    }

    // ---------- Public (no login) ----------

    @GetMapping("/public/{slug}")
    public ResponseEntity<?> publicAlbum(@PathVariable String slug) {
        return albums.findBySlug(slug).<ResponseEntity<?>>map(a -> ResponseEntity.ok()
                        .cacheControl(CacheControl.noCache())
                        .body(albumView(a, false)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/public/{slug}/photos/{id}/{size}")
    public ResponseEntity<?> photoFile(@PathVariable String slug, @PathVariable Long id, @PathVariable String size) throws IOException {
        TripAlbum a = albums.findBySlug(slug).orElse(null);
        TripPhoto p = photos.findById(id).orElse(null);
        // Hidden photos are left off the page but still served here, so the admin page can show them
        if (a == null || p == null || !a.getId().equals(p.getAlbumId())) {
            return ResponseEntity.notFound().build();
        }
        boolean clip = "clip".equals(size);
        if (clip && (p.getVideoName() == null || !p.isReady())) return ResponseEntity.notFound().build();
        Path f = clip ? service.fileFor(p, p.getVideoName()) : service.photoPath(p, "thumb".equals(size));
        if (!Files.exists(f)) return ResponseEntity.notFound().build();
        // Range requests (needed by iPhones to play video) are handled by Spring for Resource bodies
        return ResponseEntity.ok().contentType(clip ? MediaType.parseMediaType("video/mp4") : MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .body(new FileSystemResource(f));
    }

    @PostMapping("/public/{slug}/check-pin")
    public ResponseEntity<?> checkPin(@PathVariable String slug, @RequestBody Map<String, Object> body, HttpServletRequest req) {
        TripAlbum a = albums.findBySlug(slug).orElse(null);
        if (a == null) return ResponseEntity.notFound().build();
        try {
            boolean ok = service.checkPin(a, String.valueOf(body.getOrDefault("pin", "")), clientKey(req));
            return ResponseEntity.ok(Map.of("ok", ok));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(429).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(value = "/public/{slug}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@PathVariable String slug,
                                    @RequestParam String pin,
                                    @RequestParam String uploadedBy,
                                    @RequestParam(required = false) String caption,
                                    @RequestParam(required = false) String capturedAt,
                                    @RequestParam(required = false) Boolean dateGuessed,
                                    @RequestParam(required = false) Double latitude,
                                    @RequestParam(required = false) Double longitude,
                                    @RequestParam(required = false) Integer width,
                                    @RequestParam(required = false) Integer height,
                                    @RequestParam(required = false) String fingerprint,
                                    @RequestParam("file") MultipartFile file,
                                    @RequestParam("thumb") MultipartFile thumb,
                                    @RequestParam(value = "motion", required = false) MultipartFile motion,
                                    HttpServletRequest req) {
        TripAlbum a = albums.findBySlug(slug).orElse(null);
        if (a == null) return ResponseEntity.notFound().build();
        try {
            if (!service.checkPin(a, pin, clientKey(req))) return ResponseEntity.status(403).body(Map.of("error", "Wrong PIN"));
            String who = trim(uploadedBy, 60);
            if (who == null) return ResponseEntity.badRequest().body(Map.of("error", "Choose your name"));
            TripPhoto p = new TripPhoto();
            p.setUploadedBy(who);
            p.setCaption(trim(caption, 300));
            p.setCapturedAt(parseTime(capturedAt));
            p.setDateGuessed(p.getCapturedAt() == null || Boolean.TRUE.equals(dateGuessed));
            if (p.getCapturedAt() == null) p.setCapturedAt(LocalDateTime.now(IST));
            if (latitude != null && longitude != null && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
                p.setLatitude(latitude);
                p.setLongitude(longitude);
            }
            p.setWidth(width);
            p.setHeight(height);
            p.setFingerprint(trim(fingerprint, 200));
            TripPhoto saved = service.save(a, file, thumb, motion, p);
            // save() hands back the photo already in the album when the same one is uploaded again
            if (saved == p && "PROCESSING".equals(saved.getStatus())) videos.submit(saved.getId());
            return ResponseEntity.ok(Map.of("id", saved.getId(), "duplicate", saved != p));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(429).body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Could not save the photo"));
        }
    }

    /** Friends delete with the PIN: items leave the page at once and go to "Recently deleted" for the admin */
    @PostMapping("/public/{slug}/delete")
    public ResponseEntity<?> publicDelete(@PathVariable String slug, @RequestBody Map<String, Object> body, HttpServletRequest req) {
        TripAlbum a = albums.findBySlug(slug).orElse(null);
        if (a == null) return ResponseEntity.notFound().build();
        try {
            if (!service.checkPin(a, String.valueOf(body.getOrDefault("pin", "")), clientKey(req))) {
                return ResponseEntity.status(403).body(Map.of("error", "Wrong PIN"));
            }
        } catch (IllegalStateException e) {
            return ResponseEntity.status(429).body(Map.of("error", e.getMessage()));
        }
        String who = trim(body.get("deletedBy"), 60);
        if (who == null) return ResponseEntity.badRequest().body(Map.of("error", "Choose your name"));
        int n = 0;
        for (Long id : ids(body.get("ids"))) {
            TripPhoto p = photos.findById(id).filter(x -> x.getAlbumId().equals(a.getId()) && x.getDeletedAt() == null).orElse(null);
            if (p == null) continue;
            p.setDeletedAt(LocalDateTime.now(IST));
            p.setDeletedBy(who);
            photos.save(p);
            n++;
        }
        return ResponseEntity.ok(Map.of("deleted", n));
    }

    /** A video (up to 2 minutes). It is converted in the background and shows on the page when ready. */
    @PostMapping(value = "/public/{slug}/upload-video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadVideo(@PathVariable String slug,
                                         @RequestParam String pin,
                                         @RequestParam String uploadedBy,
                                         @RequestParam(required = false) String caption,
                                         @RequestParam(required = false) String capturedAt,
                                         @RequestParam(required = false) Boolean dateGuessed,
                                         @RequestParam(required = false) Double durationSec,
                                         @RequestParam(required = false) String fingerprint,
                                         @RequestParam("file") MultipartFile file,
                                         HttpServletRequest req) {
        TripAlbum a = albums.findBySlug(slug).orElse(null);
        if (a == null) return ResponseEntity.notFound().build();
        try {
            if (!service.checkPin(a, pin, clientKey(req))) return ResponseEntity.status(403).body(Map.of("error", "Wrong PIN"));
            String who = trim(uploadedBy, 60);
            if (who == null) return ResponseEntity.badRequest().body(Map.of("error", "Choose your name"));
            if (durationSec != null && durationSec > TripVideoProcessor.MAX_SECONDS + 2) {
                return ResponseEntity.badRequest().body(Map.of("error", "Videos can be up to 2 minutes long"));
            }
            TripPhoto p = new TripPhoto();
            p.setUploadedBy(who);
            p.setCaption(trim(caption, 300));
            p.setCapturedAt(parseTime(capturedAt));
            p.setDateGuessed(p.getCapturedAt() == null || Boolean.TRUE.equals(dateGuessed));
            if (p.getCapturedAt() == null) p.setCapturedAt(LocalDateTime.now(IST));
            p.setFingerprint(trim(fingerprint, 200));
            TripPhoto saved = service.saveVideo(a, file, p);
            if (saved == p) videos.submit(saved.getId());
            return ResponseEntity.ok(Map.of("id", saved.getId(), "duplicate", saved != p));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(429).body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Could not save the video"));
        }
    }

    // ---------- Admin (logged in) ----------

    @GetMapping
    @PreAuthorize(MANAGE)
    public List<Map<String, Object>> list() {
        return albums.findAllByOrderByCreatedAtDesc().stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("slug", a.getSlug());
            m.put("title", a.getTitle());
            m.put("photos", photos.countByAlbumId(a.getId()));
            m.put("hasPin", a.getUploadPinHash() != null);
            return m;
        }).toList();
    }

    @PostMapping
    @PreAuthorize(MANAGE)
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            TripAlbum a = new TripAlbum();
            a.setSlug(service.newSlug());
            a.setTitle(Optional.ofNullable(trim(body.get("title"), 120)).orElseThrow(() -> new IllegalArgumentException("Enter a title")));
            a.setSubtitle(trim(body.get("subtitle"), 300));
            service.setPin(a, trim(body.get("pin"), 8));
            a.setCreatedBy(auth.getName());
            a.setCreatedAt(LocalDateTime.now(IST));
            return ResponseEntity.ok(albumView(albums.save(a), true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize(MANAGE)
    public ResponseEntity<?> get(@PathVariable Long id) {
        return albums.findById(id).<ResponseEntity<?>>map(a -> ResponseEntity.ok(albumView(a, true)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** Update title, subtitle, cover, day stories and (optionally) the PIN */
    @PutMapping("/{id}")
    @PreAuthorize(MANAGE)
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        TripAlbum a = albums.findById(id).orElse(null);
        if (a == null) return ResponseEntity.notFound().build();
        try {
            if (body.containsKey("title")) a.setTitle(Optional.ofNullable(trim(body.get("title"), 120)).orElseThrow(() -> new IllegalArgumentException("Enter a title")));
            if (body.containsKey("subtitle")) a.setSubtitle(trim(body.get("subtitle"), 300));
            if (body.containsKey("startDate")) a.setStartDate(parseDate(body.get("startDate")));
            if (body.containsKey("endDate")) a.setEndDate(parseDate(body.get("endDate")));
            if (a.getStartDate() != null && a.getEndDate() != null && a.getEndDate().isBefore(a.getStartDate())) {
                throw new IllegalArgumentException("Trip end date is before the start date");
            }
            if (a.getStartDate() != null && a.getEndDate() != null && a.getEndDate().toEpochDay() - a.getStartDate().toEpochDay() > 60) {
                throw new IllegalArgumentException("Trip dates can cover at most 60 days");
            }
            if (body.containsKey("coverPhotoId")) a.setCoverPhotoId(body.get("coverPhotoId") instanceof Number n ? n.longValue() : null);
            if (body.get("pin") != null && !String.valueOf(body.get("pin")).isBlank()) service.setPin(a, String.valueOf(body.get("pin")).trim());
            if (body.containsKey("days")) a.setDaysJson(mapper.writeValueAsString(body.get("days")));
            return ResponseEntity.ok(albumView(albums.save(a), true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid day details"));
        }
    }

    /** Caption, highlight, hide/show and capture time of one photo */
    @PutMapping("/{id}/photos/{photoId}")
    @PreAuthorize(MANAGE)
    public ResponseEntity<?> updatePhoto(@PathVariable Long id, @PathVariable Long photoId, @RequestBody Map<String, Object> body) {
        TripPhoto p = photos.findById(photoId).filter(x -> x.getAlbumId().equals(id)).orElse(null);
        if (p == null) return ResponseEntity.notFound().build();
        if (body.containsKey("caption")) p.setCaption(trim(body.get("caption"), 300));
        if (body.containsKey("highlight")) p.setHighlight(Boolean.TRUE.equals(body.get("highlight")));
        if (body.containsKey("hidden")) p.setHidden(Boolean.TRUE.equals(body.get("hidden")));
        if (body.containsKey("capturedAt")) {
            LocalDateTime t = parseTime(String.valueOf(body.get("capturedAt")));
            if (t == null) return ResponseEntity.badRequest().body(Map.of("error", "Invalid date and time"));
            p.setCapturedAt(t);
            p.setDateGuessed(false);
        }
        return ResponseEntity.ok(photoView(photos.save(p), true));
    }

    /** Several at once: action hide, show, restore (from Recently deleted) or delete (permanently) */
    @PostMapping("/{id}/photos/bulk")
    @PreAuthorize(MANAGE)
    public ResponseEntity<?> bulk(@PathVariable Long id, @RequestBody Map<String, Object> body) throws IOException {
        String action = String.valueOf(body.get("action"));
        if (!Set.of("hide", "show", "restore", "delete").contains(action)) return ResponseEntity.badRequest().body(Map.of("error", "Unknown action"));
        int n = 0;
        for (Long pid : ids(body.get("ids"))) {
            TripPhoto p = photos.findById(pid).filter(x -> x.getAlbumId().equals(id)).orElse(null);
            if (p == null) continue;
            switch (action) {
                case "hide" -> { p.setHidden(true); photos.save(p); }
                case "show" -> { p.setHidden(false); photos.save(p); }
                case "restore" -> { p.setDeletedAt(null); p.setDeletedBy(null); photos.save(p); }
                default -> service.delete(p);
            }
            n++;
        }
        return ResponseEntity.ok(Map.of("count", n));
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    @PreAuthorize(MANAGE)
    public ResponseEntity<?> deletePhoto(@PathVariable Long id, @PathVariable Long photoId) throws IOException {
        TripPhoto p = photos.findById(photoId).filter(x -> x.getAlbumId().equals(id)).orElse(null);
        if (p != null) service.delete(p);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ---------- helpers ----------

    private Map<String, Object> albumView(TripAlbum a, boolean admin) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (admin) {
            m.put("id", a.getId());
            m.put("hasPin", a.getUploadPinHash() != null);
        }
        m.put("slug", a.getSlug());
        m.put("title", a.getTitle());
        m.put("subtitle", a.getSubtitle());
        m.put("coverPhotoId", a.getCoverPhotoId());
        m.put("startDate", a.getStartDate() == null ? null : a.getStartDate().toString());
        m.put("endDate", a.getEndDate() == null ? null : a.getEndDate().toString());
        m.put("friends", TripExpenseController.FRIENDS);
        JsonNode days = null;
        try { if (a.getDaysJson() != null) days = mapper.readTree(a.getDaysJson()); } catch (IOException ignored) { }
        m.put("days", days != null ? days : Map.of());
        m.put("photos", photos.findByAlbumIdOrderByCapturedAtAscIdAsc(a.getId()).stream()
                .filter(p -> admin || (p.getDeletedAt() == null && !Boolean.TRUE.equals(p.getHidden()) && (p.isReady() || !p.isVideo())))
                .map(p -> photoView(p, admin)).toList());
        return m;
    }

    private static Map<String, Object> photoView(TripPhoto p, boolean admin) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("w", p.getWidth());
        m.put("h", p.getHeight());
        m.put("capturedAt", p.getCapturedAt());
        m.put("dateGuessed", Boolean.TRUE.equals(p.getDateGuessed()));
        m.put("undated", isUndated(p));
        m.put("uploadedBy", p.getUploadedBy());
        m.put("caption", p.getCaption());
        m.put("highlight", Boolean.TRUE.equals(p.getHighlight()));
        m.put("type", p.isVideo() ? "VIDEO" : "PHOTO");
        m.put("live", p.isLive() && p.isReady());
        if (p.getDurationSec() != null) m.put("duration", p.getDurationSec());
        if (admin) {
            m.put("status", p.getStatus() == null ? "READY" : p.getStatus());
            m.put("statusNote", p.getStatusNote());
            m.put("deletedAt", p.getDeletedAt());
            m.put("deletedBy", p.getDeletedBy());
            m.put("hidden", Boolean.TRUE.equals(p.getHidden()));
            m.put("latitude", p.getLatitude());
            m.put("longitude", p.getLongitude());
            m.put("uploadedAt", p.getUploadedAt());
        }
        return m;
    }

    /**
     * No real date: the photo had none inside and its time is just when it was picked for upload. A photo whose
     * time came from its file date (e.g. exported from the Mac) is still placed on its day.
     * (Upload times are India time and phone times local time, hence the few hours of slack.)
     */
    private static boolean isUndated(TripPhoto p) {
        if (!Boolean.TRUE.equals(p.getDateGuessed()) || p.getCapturedAt() == null) return false;
        if (p.getUploadedAt() == null) return true;
        return Math.abs(java.time.Duration.between(p.getCapturedAt(), p.getUploadedAt()).toHours()) < 6;
    }

    private static java.time.LocalDate parseDate(Object o) {
        if (o == null || String.valueOf(o).isBlank()) return null;
        try {
            return java.time.LocalDate.parse(String.valueOf(o).trim().substring(0, 10));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date: " + o);
        }
    }

    private static LocalDateTime parseTime(String s) {
        if (s == null || s.isBlank() || "null".equals(s)) return null;
        try {
            LocalDateTime t = LocalDateTime.parse(s.trim().replace(' ', 'T').replaceAll("(\\.\\d+)?(Z|[+-]\\d\\d:?\\d\\d)$", ""));
            return t.getYear() < 2000 || t.getYear() > 2100 ? null : t;
        } catch (Exception e) {
            return null;
        }
    }

    private static String trim(Object o, int max) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        if (s.isEmpty()) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }

    private static List<Long> ids(Object o) {
        List<Long> out = new ArrayList<>();
        if (o instanceof Collection<?> c) {
            for (Object x : c) {
                if (out.size() >= 500) break;
                if (x instanceof Number n) out.add(n.longValue());
                else try { out.add(Long.parseLong(String.valueOf(x))); } catch (NumberFormatException ignored) { }
            }
        }
        return out;
    }

    private static String clientKey(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        return xff != null && !xff.isBlank() ? xff.split(",")[0].trim() : req.getRemoteAddr();
    }
}
