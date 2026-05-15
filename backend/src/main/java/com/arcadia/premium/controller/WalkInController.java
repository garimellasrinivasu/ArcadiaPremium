package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateWalkInRequest;
import com.arcadia.premium.dto.WalkInDto;
import com.arcadia.premium.service.WalkInService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/walk-ins")
public class WalkInController {

    private final WalkInService service;

    public WalkInController(WalkInService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'WALK_INS')")
    public ResponseEntity<WalkInDto> create(@Valid @RequestBody CreateWalkInRequest req,
                                             Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'WALK_INS')")
    public ResponseEntity<WalkInDto> update(@PathVariable Long id,
                                             @Valid @RequestBody CreateWalkInRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'WALK_INS')")
    public ResponseEntity<List<WalkInDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/project/{projectName}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'WALK_INS')")
    public ResponseEntity<List<WalkInDto>> getByProject(@PathVariable String projectName) {
        return ResponseEntity.ok(service.getByProject(projectName));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'WALK_INS')")
    public ResponseEntity<List<WalkInDto>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(service.getByStatus(status));
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'WALK_INS')")
    public ResponseEntity<List<WalkInDto>> getByDateRange(@RequestParam String from,
                                                           @RequestParam String to) {
        return ResponseEntity.ok(service.getByDateRange(LocalDate.parse(from), LocalDate.parse(to)));
    }

    @GetMapping("/pending-followups")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'WALK_INS')")
    public ResponseEntity<List<WalkInDto>> getPendingFollowUps() {
        return ResponseEntity.ok(service.getPendingFollowUps());
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'WALK_INS')")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @RequestParam(required = false) String project,
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(service.getDashboardStats(project, LocalDate.parse(from), LocalDate.parse(to)));
    }
}
