package com.arcadia.premium.controller;

import com.arcadia.premium.model.ShowcaseVisit;
import com.arcadia.premium.repository.ShowcaseVisitRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Visitor counts for the public Deewali showcase pages (/arcadia/, /redfern/, /aalaya-arvindham/).
 * The pages call {@code track} without login; it only records a visit and returns nothing.
 * The summary is for logged-in users with the Deewali page permission.
 */
@RestController
@RequestMapping("/api/showcase-visits")
public class ShowcaseVisitController {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final List<String> PAGES = List.of("arcadia", "redfern", "aalaya-arvindham");
    private static final Pattern VISITOR_ID = Pattern.compile("[A-Za-z0-9-]{8,40}");
    private static final Pattern BOT = Pattern.compile("(?i)bot|crawl|spider|slurp|headless|preview|facebookexternalhit|whatsapp");
    private static final String VIEW = "hasRole('ADMIN') or @pageAccess.hasAnyAccess(authentication, 'DIWALI_INVITES')";

    private final ShowcaseVisitRepository repo;

    public ShowcaseVisitController(ShowcaseVisitRepository repo) {
        this.repo = repo;
    }

    /** Public: record one visit. A reload by the same device within 30 minutes is not counted again. */
    @PostMapping("/track")
    public ResponseEntity<Void> track(@RequestBody Map<String, Object> body,
                                      @RequestHeader(value = "User-Agent", required = false) String ua) {
        String page = String.valueOf(body.getOrDefault("page", ""));
        String visitorId = String.valueOf(body.getOrDefault("visitorId", ""));
        if (!PAGES.contains(page) || !VISITOR_ID.matcher(visitorId).matches() || ua == null || BOT.matcher(ua).find()) {
            return ResponseEntity.noContent().build();
        }
        LocalDateTime now = LocalDateTime.now(IST);
        synchronized (this) {
            if (repo.existsByPageAndVisitorIdAndVisitedAtAfter(page, visitorId, now.minusMinutes(30))) {
                return ResponseEntity.noContent().build();
            }
            ShowcaseVisit v = new ShowcaseVisit();
            v.setPage(page);
            v.setVisitedAt(now);
            v.setVisitorId(visitorId);
            v.setDevice(deviceOf(ua));
            v.setReferrer(referrerHost(String.valueOf(body.getOrDefault("referrer", ""))));
            repo.save(v);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    @PreAuthorize(VIEW)
    public Map<String, Object> summary() {
        List<ShowcaseVisit> all = repo.findAllByOrderByVisitedAtDesc();
        LocalDate today = LocalDate.now(IST);

        List<Map<String, Object>> pages = new ArrayList<>();
        for (String p : PAGES) {
            List<ShowcaseVisit> vs = all.stream().filter(v -> p.equals(v.getPage())).toList();
            Map<String, Long> devices = new TreeMap<>();
            vs.forEach(v -> devices.merge(v.getDevice(), 1L, Long::sum));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("page", p);
            row.put("visits", vs.size());
            row.put("visitors", vs.stream().map(ShowcaseVisit::getVisitorId).distinct().count());
            row.put("today", vs.stream().filter(v -> v.getVisitedAt().toLocalDate().equals(today)).count());
            row.put("devices", devices);
            pages.add(row);
        }

        // Visits per day, newest first, one count per page
        Map<LocalDate, Map<String, Long>> byDay = new TreeMap<>(Comparator.reverseOrder());
        for (ShowcaseVisit v : all) {
            byDay.computeIfAbsent(v.getVisitedAt().toLocalDate(), d -> new HashMap<>()).merge(v.getPage(), 1L, Long::sum);
        }
        List<Map<String, Object>> daily = new ArrayList<>();
        byDay.forEach((d, counts) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", d.toString());
            PAGES.forEach(p -> row.put(p, counts.getOrDefault(p, 0L)));
            daily.add(row);
        });

        List<Map<String, Object>> recent = all.stream().limit(100).map(v -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("visitedAt", v.getVisitedAt());
            row.put("page", v.getPage());
            row.put("device", v.getDevice());
            row.put("referrer", v.getReferrer());
            return row;
        }).toList();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("pages", pages);
        out.put("daily", daily);
        out.put("recent", recent);
        return out;
    }

    private static String deviceOf(String ua) {
        if (ua.contains("iPhone") || ua.contains("iPad")) return "iPhone / iPad";
        if (ua.contains("Android")) return "Android";
        if (ua.contains("Windows") || ua.contains("Macintosh") || ua.contains("Linux") || ua.contains("CrOS")) return "Desktop";
        return "Other";
    }

    private static String referrerHost(String ref) {
        try {
            String host = java.net.URI.create(ref).getHost();
            if (host == null || host.contains("arcadiapremium")) return null;
            return host.length() > 100 ? host.substring(0, 100) : host;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
