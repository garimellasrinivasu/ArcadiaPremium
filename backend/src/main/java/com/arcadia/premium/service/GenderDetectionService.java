package com.arcadia.premium.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.*;

@Service
public class GenderDetectionService {

    private static final Logger log = LoggerFactory.getLogger(GenderDetectionService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.detection.python-path:python3}")
    private String pythonPath;

    @Value("${app.detection.script-dir:}")
    private String scriptDirOverride;

    /**
     * Detect faces and classify gender in a base64-encoded image.
     * Calls the Python script detect_gender.py via ProcessBuilder.
     */
    public JsonNode detectGender(String imageBase64) {
        Path tempFile = null;
        try {
            // Resolve script path
            String scriptDir = resolveScriptDir();
            String scriptPath = scriptDir + File.separator + "detect_gender.py";

            if (!new File(scriptPath).exists()) {
                return errorNode("Python script not found at: " + scriptPath);
            }

            // Write base64 data to a temp file (avoids command-line length limits)
            tempFile = Files.createTempFile("detect_img_", ".b64");
            Files.writeString(tempFile, imageBase64);

            // Execute Python script
            ProcessBuilder pb = new ProcessBuilder(pythonPath, scriptPath, tempFile.toString());
            pb.redirectErrorStream(false);
            pb.environment().put("PYTHONIOENCODING", "utf-8");
            pb.environment().put("PYTHONUNBUFFERED", "1");

            log.info("Running gender detection script...");
            Process process = pb.start();

            // Read stdout and stderr CONCURRENTLY to avoid deadlock
            CompletableFuture<String> stdoutFuture = CompletableFuture.supplyAsync(() -> readStream(process.getInputStream()));
            CompletableFuture<String> stderrFuture = CompletableFuture.supplyAsync(() -> readStream(process.getErrorStream()));

            boolean finished = process.waitFor(300, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return errorNode("Detection timed out after 120 seconds");
            }

            String stdout = stdoutFuture.get(5, TimeUnit.SECONDS);
            String stderr = stderrFuture.get(5, TimeUnit.SECONDS);

            if (!stderr.isEmpty()) {
                log.debug("Python stderr: {}", stderr.substring(0, Math.min(stderr.length(), 300)));
            }

            log.info("Detection stdout [{}chars]: {}", stdout.length(),
                    stdout.substring(0, Math.min(stdout.length(), 500)));

            if (stdout.isEmpty()) {
                return errorNode("Python script returned no output. Exit code: " + process.exitValue());
            }

            // Extract JSON — find the {"total" key which is our root object
            int jsonStart = stdout.indexOf("{\"total\"");
            if (jsonStart < 0) {
                // Fallback: find the first '{'
                jsonStart = stdout.indexOf('{');
            }
            if (jsonStart < 0) {
                return errorNode("No JSON in output: " + stdout.substring(0, Math.min(stdout.length(), 300)));
            }
            String jsonStr = stdout.substring(jsonStart);

            JsonNode result = objectMapper.readTree(jsonStr);
            log.info("Detection result: total={}, male={}, female={}",
                    result.path("total").asInt(), result.path("male").asInt(), result.path("female").asInt());
            return result;

        } catch (Exception e) {
            log.error("Gender detection failed", e);
            return errorNode("Detection error: " + e.getMessage());
        } finally {
            if (tempFile != null) {
                try { Files.deleteIfExists(tempFile); } catch (IOException ignored) {}
            }
        }
    }

    private String readStream(InputStream is) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            return sb.toString().trim();
        } catch (IOException e) {
            return "";
        }
    }

    private String resolveScriptDir() {
        if (scriptDirOverride != null && !scriptDirOverride.isBlank()) {
            return scriptDirOverride;
        }
        String[] candidates = { "scripts", "backend/scripts", "../backend/scripts",
                System.getProperty("user.dir") + "/scripts" };
        for (String candidate : candidates) {
            File dir = new File(candidate);
            if (dir.exists() && new File(dir, "detect_gender.py").exists()) {
                return dir.getAbsolutePath();
            }
        }
        return "scripts";
    }

    private JsonNode errorNode(String message) {
        try {
            return objectMapper.readTree("{\"error\":\"" +
                    message.replace("\"", "'").replace("\n", " ").replace("\\", "/") + "\"}");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
