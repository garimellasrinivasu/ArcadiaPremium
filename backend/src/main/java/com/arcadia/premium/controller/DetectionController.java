package com.arcadia.premium.controller;

import com.arcadia.premium.service.GenderDetectionService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/detect")
public class DetectionController {

    private final GenderDetectionService detectionService;

    public DetectionController(GenderDetectionService detectionService) {
        this.detectionService = detectionService;
    }

    /**
     * POST /api/detect/gender
     * Body: { "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..." }
     * Returns: { "total": 6, "male": 3, "female": 3, "faces": [...] }
     */
    @PostMapping("/gender")
    public ResponseEntity<JsonNode> detectGender(@RequestBody Map<String, String> request) {
        String imageBase64 = request.get("imageBase64");
        if (imageBase64 == null || imageBase64.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        JsonNode result = detectionService.detectGender(imageBase64);
        return ResponseEntity.ok(result);
    }
}
