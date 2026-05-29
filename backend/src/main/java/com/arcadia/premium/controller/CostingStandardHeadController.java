package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CostingStandardHeadDto;
import com.arcadia.premium.service.CostingStandardHeadService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/costing-standard-heads")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SUPERVISOR') or @pageAccess.hasAccess(authentication, 'COSTING_STANDARD_HEAD')")
public class CostingStandardHeadController {

    private final CostingStandardHeadService service;

    public CostingStandardHeadController(CostingStandardHeadService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CostingStandardHeadDto> create(@RequestBody Map<String, Object> body, Authentication auth) {
        String createdBy = auth.getName();
        return ResponseEntity.ok(service.create(body, createdBy));
    }

    @GetMapping
    public ResponseEntity<List<CostingStandardHeadDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<CostingStandardHeadDto>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/category")
    public ResponseEntity<List<CostingStandardHeadDto>> getByCategory(@RequestParam String category) {
        return ResponseEntity.ok(service.getByCategory(category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CostingStandardHeadDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CostingStandardHeadDto> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<CostingStandardHeadDto> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }
}
