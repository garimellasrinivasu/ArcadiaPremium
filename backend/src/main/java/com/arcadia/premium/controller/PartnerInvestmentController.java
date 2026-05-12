package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreatePartnerInvestmentRequest;
import com.arcadia.premium.dto.PartnerInvestmentDto;
import com.arcadia.premium.service.PartnerInvestmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partner-investments")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER')")
public class PartnerInvestmentController {

    private final PartnerInvestmentService service;

    public PartnerInvestmentController(PartnerInvestmentService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<PartnerInvestmentDto> create(
            @RequestBody CreatePartnerInvestmentRequest req,
            Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<PartnerInvestmentDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PartnerInvestmentDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/my-submissions")
    public ResponseEntity<List<PartnerInvestmentDto>> mySubmissions(Authentication auth) {
        return ResponseEntity.ok(service.getMySubmissions(auth.getName()));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PartnerInvestmentDto>> pending() {
        return ResponseEntity.ok(service.getPending());
    }

    @GetMapping("/approved")
    public ResponseEntity<List<PartnerInvestmentDto>> approved() {
        return ResponseEntity.ok(service.getApproved());
    }

    @GetMapping("/by-project")
    public ResponseEntity<List<PartnerInvestmentDto>> byProject(@RequestParam String project) {
        return ResponseEntity.ok(service.getByProject(project));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<PartnerInvestmentDto> approve(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String signature = body.get("signature");
        return ResponseEntity.ok(service.approve(id, signature, auth.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/partner-names")
    public ResponseEntity<List<String>> partnerNames() {
        return ResponseEntity.ok(service.getPartnerNames());
    }

    @GetMapping("/partner-names-by-project")
    public ResponseEntity<List<String>> partnerNamesByProject(@RequestParam String project) {
        return ResponseEntity.ok(service.getPartnerNamesForProject(project));
    }

    /** One-time migration to fix existing entries missing auto-approvals */
    @PostMapping("/migrate-auto-approvals")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> migrateAutoApprovals() {
        int fixed = service.migrateAutoApprovals();
        return ResponseEntity.ok(Map.of("fixed", fixed, "message", "Migration complete"));
    }
}
