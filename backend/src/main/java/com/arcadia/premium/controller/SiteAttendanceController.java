package com.arcadia.premium.controller;

import com.arcadia.premium.dto.ApproveAttendanceRequest;
import com.arcadia.premium.dto.CreateSiteAttendanceRequest;
import com.arcadia.premium.dto.SiteAttendanceDto;
import com.arcadia.premium.service.SiteAttendanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/site-attendance")
public class SiteAttendanceController {

    private final SiteAttendanceService service;

    public SiteAttendanceController(SiteAttendanceService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<SiteAttendanceDto> create(
            @Valid @RequestBody CreateSiteAttendanceRequest request,
            Authentication auth) {
        return ResponseEntity.ok(service.create(request, auth.getName()));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<SiteAttendanceDto> approve(
            @PathVariable Long id,
            @Valid @RequestBody ApproveAttendanceRequest request,
            Authentication auth) {
        return ResponseEntity.ok(service.approve(id, request, auth.getName()));
    }

    @GetMapping("/my-submissions")
    public ResponseEntity<List<SiteAttendanceDto>> mySubmissions(Authentication auth) {
        return ResponseEntity.ok(service.getMySubmissions(auth.getName()));
    }

    @GetMapping("/pending-approvals")
    public ResponseEntity<List<SiteAttendanceDto>> pendingApprovals(Authentication auth) {
        return ResponseEntity.ok(service.getPendingApprovals(auth.getName()));
    }

    @GetMapping("/pending-count")
    public ResponseEntity<Map<String, Long>> pendingCount(Authentication auth) {
        long count = service.getPendingCount(auth.getName());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping
    public ResponseEntity<List<SiteAttendanceDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'SITE_ATTENDANCE')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Record deleted successfully"));
    }
}
