package com.arcadia.premium.service;

import com.arcadia.premium.model.TripAlbum;
import com.arcadia.premium.model.TripPhoto;
import com.arcadia.premium.repository.TripAlbumRepository;
import com.arcadia.premium.repository.TripPhotoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Trip memories: albums, photo and video files on disk and the upload PIN.
 * Photos arrive already resized by the uploader's browser (JPEG), with a small thumbnail; videos and
 * Live Photo motion clips arrive as recorded and are converted by {@link TripVideoProcessor}.
 */
@Service
public class TripMemoryService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final String SLUG_CHARS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final long MAX_PHOTO_BYTES = 12L * 1024 * 1024;
    private static final long MAX_THUMB_BYTES = 2L * 1024 * 1024;
    private static final long MAX_VIDEO_BYTES = 1536L * 1024 * 1024;
    private static final long MAX_MOTION_BYTES = 60L * 1024 * 1024;
    /** Wrong PINs allowed from one address in 15 minutes */
    private static final int MAX_PIN_TRIES = 10;

    private final TripAlbumRepository albums;
    private final TripPhotoRepository photos;
    private final PasswordEncoder encoder;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, long[]> pinTries = new ConcurrentHashMap<>();

    @Value("${app.trip-photos.storage-dir:./data/trip-photos}")
    private String storageDir;

    @Value("${app.trip-photos.min-free-disk-mb:1500}")
    private long minFreeMb;

    public TripMemoryService(TripAlbumRepository albums, TripPhotoRepository photos, PasswordEncoder encoder) {
        this.albums = albums;
        this.photos = photos;
        this.encoder = encoder;
    }

    public String newSlug() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 16; i++) sb.append(SLUG_CHARS.charAt(random.nextInt(SLUG_CHARS.length())));
        return sb.toString();
    }

    public void setPin(TripAlbum a, String pin) {
        if (pin == null || !pin.matches("\\d{4,8}")) throw new IllegalArgumentException("PIN must be 4 to 8 digits");
        a.setUploadPinHash(encoder.encode(pin));
    }

    /** Checks the upload PIN, refusing further tries from an address after too many wrong ones */
    public boolean checkPin(TripAlbum a, String pin, String clientKey) {
        long now = System.currentTimeMillis();
        long[] t = pinTries.compute(clientKey, (k, v) -> v == null || now - v[1] > 15 * 60_000L ? new long[]{0, now} : v);
        if (t[0] >= MAX_PIN_TRIES) throw new IllegalStateException("Too many wrong PINs. Please try again in 15 minutes.");
        boolean ok = pin != null && a.getUploadPinHash() != null && encoder.matches(pin.trim(), a.getUploadPinHash());
        if (!ok) t[0]++;
        return ok;
    }

    private Path root() throws IOException {
        Path p = Paths.get(storageDir).toAbsolutePath().normalize();
        Files.createDirectories(p);
        return p;
    }

    public Path fileFor(TripPhoto p, String name) throws IOException {
        Path root = root();
        Path f = root.resolve("album-" + p.getAlbumId()).resolve(name).normalize();
        if (!f.startsWith(root)) throw new IllegalStateException("Invalid storage path");
        return f;
    }

    public Path photoPath(TripPhoto p, boolean thumb) throws IOException {
        return fileFor(p, thumb ? p.getThumbName() : p.getFileName());
    }

    private void checkSpace(long bytes) throws IOException {
        long freeMb = Files.getFileStore(root()).getUsableSpace() / (1024 * 1024);
        if (freeMb - bytes / (1024 * 1024) < minFreeMb) {
            throw new IllegalStateException("The server is low on disk space, so photos and videos can't be added right now.");
        }
    }

    /** Saves an uploaded video; it is converted in the background (status PROCESSING until done). */
    public TripPhoto saveVideo(TripAlbum album, MultipartFile file, TripPhoto details) throws IOException {
        if (details.getFingerprint() != null) {
            var existing = photos.findFirstByAlbumIdAndFingerprint(album.getId(), details.getFingerprint());
            if (existing.isPresent()) return existing.get();
        }
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Video is missing");
        if (file.getSize() > MAX_VIDEO_BYTES) throw new IllegalArgumentException("Video is too large (over 1.5 GB)");
        checkSpace(file.getSize() * 2);
        String base = UUID.randomUUID().toString();
        details.setAlbumId(album.getId());
        details.setMediaType("VIDEO");
        details.setStatus("PROCESSING");
        details.setFileName(base + ".jpg");
        details.setThumbName(base + "-t.jpg");
        details.setVideoName(base + ".mp4");
        details.setSourceName(base + "-src" + extension(file.getOriginalFilename(), ".mov"));
        details.setSizeBytes(file.getSize());
        details.setUploadedAt(LocalDateTime.now(IST));
        if (details.getHighlight() == null) details.setHighlight(false);
        if (details.getHidden() == null) details.setHidden(false);
        Path src = fileFor(details, details.getSourceName());
        Files.createDirectories(src.getParent());
        try (InputStream in = file.getInputStream()) { Files.copy(in, src, StandardCopyOption.REPLACE_EXISTING); }
        try {
            return photos.save(details);
        } catch (RuntimeException e) {
            Files.deleteIfExists(src);
            throw e;
        }
    }

    private static String extension(String name, String fallback) {
        if (name == null) return fallback;
        String n = name.toLowerCase();
        int dot = n.lastIndexOf('.');
        String ext = dot >= 0 ? n.substring(dot) : "";
        return ext.matches("\\.(mov|mp4|m4v|3gp|webm|mkv|avi)") ? ext : fallback;
    }

    /** Saves an uploaded photo. Returns the existing photo when the same one was already added. */
    public TripPhoto save(TripAlbum album, MultipartFile file, MultipartFile thumb, MultipartFile motion, TripPhoto details) throws IOException {
        if (details.getFingerprint() != null) {
            var existing = photos.findFirstByAlbumIdAndFingerprint(album.getId(), details.getFingerprint());
            if (existing.isPresent()) return existing.get();
        }
        checkJpeg(file, MAX_PHOTO_BYTES, "Photo");
        checkJpeg(thumb, MAX_THUMB_BYTES, "Thumbnail");
        boolean live = motion != null && !motion.isEmpty();
        if (live && motion.getSize() > MAX_MOTION_BYTES) live = false;
        checkSpace(file.getSize() + (live ? motion.getSize() : 0));
        String base = UUID.randomUUID().toString();
        details.setAlbumId(album.getId());
        details.setMediaType("PHOTO");
        details.setStatus("READY");
        details.setFileName(base + ".jpg");
        details.setThumbName(base + "-t.jpg");
        details.setSizeBytes(file.getSize());
        details.setUploadedAt(LocalDateTime.now(IST));
        if (details.getHighlight() == null) details.setHighlight(false);
        if (details.getHidden() == null) details.setHidden(false);
        Path full = fileFor(details, details.getFileName());
        Path small = fileFor(details, details.getThumbName());
        Files.createDirectories(full.getParent());
        try (InputStream in = file.getInputStream()) { Files.copy(in, full, StandardCopyOption.REPLACE_EXISTING); }
        try (InputStream in = thumb.getInputStream()) { Files.copy(in, small, StandardCopyOption.REPLACE_EXISTING); }
        Path clip = null;
        if (live) {
            // Live Photo: keep the motion clip; it is converted in the background
            details.setVideoName(base + "-live.mp4");
            details.setSourceName(base + "-live-src" + extension(motion.getOriginalFilename(), ".mov"));
            details.setStatus("PROCESSING");
            clip = fileFor(details, details.getSourceName());
            try (InputStream in = motion.getInputStream()) { Files.copy(in, clip, StandardCopyOption.REPLACE_EXISTING); }
        }
        try {
            return photos.save(details);
        } catch (RuntimeException e) {
            Files.deleteIfExists(full);
            Files.deleteIfExists(small);
            if (clip != null) Files.deleteIfExists(clip);
            throw e;
        }
    }

    public void delete(TripPhoto p) throws IOException {
        Files.deleteIfExists(photoPath(p, false));
        Files.deleteIfExists(photoPath(p, true));
        if (p.getVideoName() != null) Files.deleteIfExists(fileFor(p, p.getVideoName()));
        if (p.getSourceName() != null) Files.deleteIfExists(fileFor(p, p.getSourceName()));
        photos.delete(p);
    }

    private static void checkJpeg(MultipartFile f, long max, String what) throws IOException {
        if (f == null || f.isEmpty()) throw new IllegalArgumentException(what + " is missing");
        if (f.getSize() > max) throw new IllegalArgumentException(what + " is too large");
        try (InputStream in = f.getInputStream()) {
            byte[] head = in.readNBytes(3);
            if (head.length < 3 || (head[0] & 0xFF) != 0xFF || (head[1] & 0xFF) != 0xD8 || (head[2] & 0xFF) != 0xFF) {
                throw new IllegalArgumentException(what + " must be a JPEG image");
            }
        }
    }
}
