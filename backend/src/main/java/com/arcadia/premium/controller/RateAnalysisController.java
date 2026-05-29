package com.arcadia.premium.controller;

import com.arcadia.premium.dto.RateAnalysisDto;
import com.arcadia.premium.service.RateAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rate-analyses")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SUPERVISOR') or @pageAccess.hasAccess(authentication, 'RATE_ANALYSIS')")
public class RateAnalysisController {

    private final RateAnalysisService service;

    public RateAnalysisController(RateAnalysisService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<RateAnalysisDto> create(
            @RequestBody Map<String, Object> req,
            Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<RateAnalysisDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<RateAnalysisDto>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(service.getByProject(projectId));
    }

    @GetMapping("/by-activity/{activityId}")
    public ResponseEntity<List<RateAnalysisDto>> getByActivity(@PathVariable Long activityId) {
        return ResponseEntity.ok(service.getByActivity(activityId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RateAnalysisDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<RateAnalysisDto> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
