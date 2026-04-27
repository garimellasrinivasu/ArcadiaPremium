package com.arcadia.premium.controller;

import com.arcadia.premium.dto.ApprovalChainDto;
import com.arcadia.premium.dto.CreateApprovalChainRequest;
import com.arcadia.premium.service.ApprovalChainService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/approval-chains")
public class ApprovalChainController {

    private final ApprovalChainService service;

    public ApprovalChainController(ApprovalChainService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ApprovalChainDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApprovalChainDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApprovalChainDto> create(@Valid @RequestBody CreateApprovalChainRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApprovalChainDto> update(@PathVariable Long id,
                                                    @Valid @RequestBody CreateApprovalChainRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
