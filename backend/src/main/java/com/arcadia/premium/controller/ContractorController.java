package com.arcadia.premium.controller;

import com.arcadia.premium.dto.ContractorDto;
import com.arcadia.premium.dto.CreateContractorRequest;
import com.arcadia.premium.service.ContractorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contractors")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'CONTRACTORS')")
public class ContractorController {

    private final ContractorService service;

    public ContractorController(ContractorService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ContractorDto> create(@RequestBody CreateContractorRequest req, Authentication auth) {
        String createdBy = auth.getName();
        return ResponseEntity.ok(service.create(req, createdBy));
    }

    @GetMapping
    public ResponseEntity<List<ContractorDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ContractorDto>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/type")
    public ResponseEntity<List<ContractorDto>> getByType(@RequestParam String type) {
        return ResponseEntity.ok(service.getByType(type));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ContractorDto>> search(@RequestParam String name) {
        return ResponseEntity.ok(service.search(name));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractorDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContractorDto> update(@PathVariable Long id, @RequestBody CreateContractorRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<ContractorDto> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }
}
