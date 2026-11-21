package com.arcadia.premium.service;

import com.arcadia.premium.model.TripPhoto;
import com.arcadia.premium.repository.TripPhotoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Converts uploaded trip videos (and Live Photo motion clips) with ffmpeg into small 720p MP4s that play on any
 * phone, and makes a cover frame and thumbnail for videos. One at a time, in the background, so uploads return
 * quickly and the server isn't overloaded. The uploaded original is deleted once converted.
 */
@Service
public class TripVideoProcessor {

    private static final Logger log = LoggerFactory.getLogger(TripVideoProcessor.class);
    public static final double MAX_SECONDS = 120;
    private static final Pattern ISO6709 = Pattern.compile("^([+-]\\d+(?:\\.\\d+)?)([+-]\\d+(?:\\.\\d+)?)");
    private static final DateTimeFormatter APPLE_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss[.SSS]XX");

    private final TripPhotoRepository photos;
    private final TripMemoryService storage;
    private final ObjectMapper mapper = new ObjectMapper();
    private final ExecutorService worker = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "trip-video");
        t.setDaemon(true);
        return t;
    });

    @Value("${app.trip-photos.ffmpeg:ffmpeg}")
    private String ffmpeg;
    @Value("${app.trip-photos.ffprobe:ffprobe}")
    private String ffprobe;
    /** Time zone for videos that only carry a UTC time (Vietnam and Phuket are both UTC+7) */
    @Value("${app.trip-photos.default-zone:Asia/Ho_Chi_Minh}")
    private String defaultZone;

    public TripVideoProcessor(TripPhotoRepository photos, TripMemoryService storage) {
        this.photos = photos;
        this.storage = storage;
    }

    /** Picks up anything left half-done by a restart */
    @EventListener(ApplicationReadyEvent.class)
    public void resume() {
        photos.findByStatus("PROCESSING").forEach(p -> submit(p.getId()));
    }

    public void submit(Long id) {
        worker.submit(() -> process(id));
    }

    @PreDestroy
    public void stop() {
        worker.shutdownNow();
    }

    private void process(Long id) {
        TripPhoto p = photos.findById(id).orElse(null);
        if (p == null || p.getSourceName() == null) return;
        try {
            Path src = storage.fileFor(p, p.getSourceName());
            if (!Files.exists(src)) throw new IOException("Uploaded file is missing");
            JsonNode info = probe(src);
            double dur = info.path("format").path("duration").asDouble(0);
            if (p.isVideo() && dur > MAX_SECONDS + 2) {
                fail(p, src, "Longer than 2 minutes (" + Math.round(dur) + " s)");
                return;
            }
            p.setDurationSec(Math.round(dur * 10) / 10.0);
            if (p.isVideo()) readTags(p, info.path("format").path("tags"));

            Path mp4 = storage.fileFor(p, p.getVideoName());
            List<String> cmd = new ArrayList<>(List.of(ffmpeg, "-y", "-v", "error", "-i", src.toString(),
                    "-vf", "scale=w='if(gte(iw,ih),min(1280,iw),-2)':h='if(gte(iw,ih),-2,min(1280,ih))',format=yuv420p",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-threads", "2",
                    "-movflags", "+faststart"));
            if (p.isVideo()) cmd.addAll(List.of("-c:a", "aac", "-b:a", "128k"));
            else cmd.add("-an"); // Live Photo clips play silently
            cmd.add(mp4.toString());
            run(cmd, 900);

            if (p.isVideo()) {
                Path full = storage.fileFor(p, p.getFileName());
                Path thumb = storage.fileFor(p, p.getThumbName());
                String at = String.valueOf(Math.min(1.0, dur / 3));
                run(List.of(ffmpeg, "-y", "-v", "error", "-ss", at, "-i", mp4.toString(), "-frames:v", "1", "-q:v", "3", full.toString()), 120);
                run(List.of(ffmpeg, "-y", "-v", "error", "-i", full.toString(), "-vf", "scale=w='if(gte(iw,ih),640,-2)':h='if(gte(iw,ih),-2,640)'",
                        "-q:v", "5", thumb.toString()), 60);
                JsonNode v = probe(mp4).path("streams");
                for (JsonNode s : v) {
                    if ("video".equals(s.path("codec_type").asText())) {
                        p.setWidth(s.path("width").asInt());
                        p.setHeight(s.path("height").asInt());
                        break;
                    }
                }
                p.setSizeBytes(Files.size(mp4));
            }
            Files.deleteIfExists(src);
            p.setSourceName(null);
            p.setStatus("READY");
            p.setStatusNote(null);
            saveResult(p);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.warn("Trip video {} could not be converted: {}", id, e.getMessage());
            try {
                fail(p, p.getSourceName() == null ? null : storage.fileFor(p, p.getSourceName()), "Could not convert this video");
            } catch (IOException ignored) { }
        }
    }

    private void fail(TripPhoto p, Path src, String why) throws IOException {
        if (src != null) Files.deleteIfExists(src);
        p.setSourceName(null);
        if (p.isVideo()) {
            p.setStatus("FAILED");
            p.setStatusNote(why);
        } else {
            // A Live Photo still works as a normal photo without its motion clip
            if (p.getVideoName() != null) Files.deleteIfExists(storage.fileFor(p, p.getVideoName()));
            p.setVideoName(null);
            p.setStatus("READY");
        }
        saveResult(p);
    }

    /** Writes only what the conversion found onto the current row, so caption edits made meanwhile are kept */
    private void saveResult(TripPhoto p) {
        photos.findById(p.getId()).ifPresent(fresh -> {
            fresh.setStatus(p.getStatus());
            fresh.setStatusNote(p.getStatusNote());
            fresh.setSourceName(p.getSourceName());
            fresh.setVideoName(p.getVideoName());
            fresh.setDurationSec(p.getDurationSec());
            if (p.isVideo()) {
                fresh.setWidth(p.getWidth());
                fresh.setHeight(p.getHeight());
                fresh.setSizeBytes(p.getSizeBytes());
                if (!Boolean.TRUE.equals(p.getDateGuessed()) && Boolean.TRUE.equals(fresh.getDateGuessed())) {
                    fresh.setCapturedAt(p.getCapturedAt());
                    fresh.setDateGuessed(false);
                }
                if (fresh.getLatitude() == null && p.getLatitude() != null) {
                    fresh.setLatitude(p.getLatitude());
                    fresh.setLongitude(p.getLongitude());
                }
            }
            photos.save(fresh);
        });
    }

    /** Capture time and place from the video's own details (iPhone: local time with offset, and ISO 6709 location) */
    private void readTags(TripPhoto p, JsonNode tags) {
        LocalDateTime at = null;
        String apple = tags.path("com.apple.quicktime.creationdate").asText(null);
        if (apple != null) {
            try { at = OffsetDateTime.parse(apple, APPLE_DATE).toLocalDateTime(); } catch (Exception ignored) { }
        }
        if (at == null && Boolean.TRUE.equals(p.getDateGuessed())) {
            String utc = tags.path("creation_time").asText(null);
            if (utc != null) {
                try { at = OffsetDateTime.parse(utc).atZoneSameInstant(ZoneId.of(defaultZone)).toLocalDateTime(); } catch (Exception ignored) { }
            }
        }
        if (at != null && at.getYear() >= 2000) {
            p.setCapturedAt(at);
            p.setDateGuessed(false);
        }
        String loc = tags.path("com.apple.quicktime.location.ISO6709").asText(tags.path("location").asText(null));
        if (loc != null && p.getLatitude() == null) {
            Matcher m = ISO6709.matcher(loc);
            if (m.find()) {
                p.setLatitude(Double.parseDouble(m.group(1)));
                p.setLongitude(Double.parseDouble(m.group(2)));
            }
        }
    }

    private JsonNode probe(Path f) throws IOException, InterruptedException {
        return mapper.readTree(run(List.of(ffprobe, "-v", "error", "-print_format", "json", "-show_format", "-show_streams", f.toString()), 60));
    }

    private static String run(List<String> cmd, int timeoutSec) throws IOException, InterruptedException {
        Process proc = new ProcessBuilder(cmd).redirectErrorStream(true).start();
        byte[] out;
        try (var in = proc.getInputStream()) { out = in.readAllBytes(); }
        if (!proc.waitFor(timeoutSec, TimeUnit.SECONDS)) {
            proc.destroyForcibly();
            throw new IOException(cmd.get(0) + " took too long");
        }
        String text = new String(out);
        if (proc.exitValue() != 0) throw new IOException(cmd.get(0) + " failed: " + text.lines().limit(3).reduce("", (a, b) -> a + " " + b));
        return text;
    }
}
