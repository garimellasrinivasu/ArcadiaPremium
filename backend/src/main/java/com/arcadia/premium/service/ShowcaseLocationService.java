package com.arcadia.premium.service;

import com.arcadia.premium.repository.ShowcaseVisitRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Looks up the approximate city of a showcase visitor from their network address (ipapi.co, no key needed)
 * and saves only the place name on the visit. The address itself is never stored.
 * Runs in the background so the public page never waits for it.
 */
@Service
public class ShowcaseLocationService {

    private static final Logger log = LoggerFactory.getLogger(ShowcaseLocationService.class);
    private static final Pattern IP = Pattern.compile("[0-9a-fA-F:.]{3,45}");

    private final ShowcaseVisitRepository repo;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();

    public ShowcaseLocationService(ShowcaseVisitRepository repo) {
        this.repo = repo;
    }

    @Async
    public void locate(Long visitId, String ip) {
        if (ip == null || !IP.matcher(ip).matches() || isPrivate(ip)) return;
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://ipapi.co/" + ip + "/json/"))
                    .timeout(Duration.ofSeconds(5)).header("User-Agent", "arcadia-premium").GET().build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return;
            JsonNode j = mapper.readTree(res.body());
            if (j.path("error").asBoolean(false)) return;
            Set<String> parts = new LinkedHashSet<>();
            for (String f : new String[]{"city", "region", "country_name"}) {
                String v = j.path(f).asText("").trim();
                if (!v.isEmpty()) parts.add(v);
            }
            if (parts.isEmpty()) return;
            String place = String.join(", ", parts);
            String trimmed = place.length() > 120 ? place.substring(0, 120) : place;
            repo.findById(visitId).ifPresent(v -> { v.setLocation(trimmed); repo.save(v); });
        } catch (Exception e) {
            log.debug("Showcase location lookup failed: {}", e.getMessage());
        }
    }

    private static boolean isPrivate(String ip) {
        try {
            InetAddress a = InetAddress.getByName(ip);
            return a.isLoopbackAddress() || a.isSiteLocalAddress() || a.isLinkLocalAddress() || a.isAnyLocalAddress()
                    || ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd");
        } catch (Exception e) {
            return true;
        }
    }
}
