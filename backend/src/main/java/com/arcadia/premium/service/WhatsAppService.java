package com.arcadia.premium.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppService.class);

    @Value("${whatsapp.api.url:https://graph.facebook.com/v21.0}")
    private String apiUrl;

    @Value("${whatsapp.phone-number-id:}")
    private String phoneNumberId;

    @Value("${whatsapp.access-token:}")
    private String accessToken;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isConfigured() {
        return phoneNumberId != null && !phoneNumberId.isEmpty()
                && accessToken != null && !accessToken.isEmpty();
    }

    /**
     * Send a text message via WhatsApp
     */
    public Map<String, Object> sendTextMessage(String toPhone, String text) {
        if (!isConfigured()) {
            log.warn("WhatsApp not configured. Skipping message to {}", toPhone);
            return Map.of("success", false, "error", "WhatsApp not configured");
        }

        String url = apiUrl + "/" + phoneNumberId + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        Map<String, Object> body = new HashMap<>();
        body.put("messaging_product", "whatsapp");
        body.put("to", toPhone);
        body.put("type", "text");
        body.put("text", Map.of("body", text));

        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            log.info("WhatsApp text sent to {}: status={}", toPhone, response.getStatusCode());
            return Map.of("success", true, "response", response.getBody());
        } catch (Exception e) {
            log.error("Failed to send WhatsApp text to {}: {}", toPhone, e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /**
     * Upload media to WhatsApp and return the media ID
     */
    public String uploadMedia(byte[] fileData, String fileName, String mimeType) {
        if (!isConfigured()) {
            return null;
        }

        String url = apiUrl + "/" + phoneNumberId + "/media";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(accessToken);

        MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
        formData.add("messaging_product", "whatsapp");
        formData.add("type", mimeType);

        ByteArrayResource fileResource = new ByteArrayResource(fileData) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };
        formData.add("file", fileResource);

        try {
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(formData, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            Map responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("id")) {
                String mediaId = responseBody.get("id").toString();
                log.info("WhatsApp media uploaded: id={}, file={}", mediaId, fileName);
                return mediaId;
            }
        } catch (Exception e) {
            log.error("Failed to upload WhatsApp media {}: {}", fileName, e.getMessage());
        }
        return null;
    }

    /**
     * Send an image via WhatsApp
     */
    public Map<String, Object> sendImage(String toPhone, byte[] imageData, String caption) {
        if (!isConfigured()) {
            return Map.of("success", false, "error", "WhatsApp not configured");
        }

        // Step 1: Upload image
        String mediaId = uploadMedia(imageData, "summary.png", "image/png");
        if (mediaId == null) {
            return Map.of("success", false, "error", "Failed to upload image");
        }

        // Step 2: Send image message
        String url = apiUrl + "/" + phoneNumberId + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        Map<String, Object> image = new HashMap<>();
        image.put("id", mediaId);
        if (caption != null && !caption.isEmpty()) {
            image.put("caption", caption);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("messaging_product", "whatsapp");
        body.put("to", toPhone);
        body.put("type", "image");
        body.put("image", image);

        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            log.info("WhatsApp image sent to {}: status={}", toPhone, response.getStatusCode());
            return Map.of("success", true, "response", response.getBody());
        } catch (Exception e) {
            log.error("Failed to send WhatsApp image to {}: {}", toPhone, e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /**
     * Send a document attachment via WhatsApp
     */
    public Map<String, Object> sendDocument(String toPhone, byte[] fileData, String fileName,
                                             String mimeType, String caption) {
        if (!isConfigured()) {
            return Map.of("success", false, "error", "WhatsApp not configured");
        }

        // Step 1: Upload media
        String mediaId = uploadMedia(fileData, fileName, mimeType);
        if (mediaId == null) {
            return Map.of("success", false, "error", "Failed to upload media");
        }

        // Step 2: Send document message
        String url = apiUrl + "/" + phoneNumberId + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        Map<String, Object> document = new HashMap<>();
        document.put("id", mediaId);
        document.put("filename", fileName);
        if (caption != null && !caption.isEmpty()) {
            document.put("caption", caption);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("messaging_product", "whatsapp");
        body.put("to", toPhone);
        body.put("type", "document");
        body.put("document", document);

        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            log.info("WhatsApp document sent to {}: file={}, status={}", toPhone, fileName, response.getStatusCode());
            return Map.of("success", true, "response", response.getBody());
        } catch (Exception e) {
            log.error("Failed to send WhatsApp document to {}: {}", toPhone, e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }
}
