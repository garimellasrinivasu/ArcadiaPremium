package com.arcadia.premium.controller;

import com.arcadia.premium.service.SubcontractingDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subcontracting-dashboard")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SUPERVISOR') or @pageAccess.hasAccess(authentication, 'SUBCONTRACTING_DASHBOARD')")
public class SubcontractingDashboardController {

    private final SubcontractingDashboardService dashboardService;

    public SubcontractingDashboardController(SubcontractingDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard(
            @RequestParam(required = false) Long projectId) {
        return ResponseEntity.ok(dashboardService.getDashboardSummary(projectId));
    }
}
