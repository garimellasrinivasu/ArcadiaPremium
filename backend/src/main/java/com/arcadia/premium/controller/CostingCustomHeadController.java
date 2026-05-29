package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CostingCustomHeadDto;
import com.arcadia.premium.service.CostingCustomHeadService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/costing-custom-heads")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SUPERVISOR') or @pageAccess.hasAccess(authentication, 'COSTING_CUSTOM_HEAD')")
public class CostingCustomHeadController {

    private final CostingCustomHeadService service;

    public CostingCustomHeadController(CostingCustomHeadService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CostingCustomHeadDto> create(@RequestBody Map<String, Object> body, Authentication auth) {
        String createdBy = auth.getName();
        return ResponseEntity.ok(service.create(body, createdBy));
    }

    @GetMapping
    public ResponseEntity<List<CostingCustomHeadDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<CostingCustomHeadDto>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<CostingCustomHeadDto>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(service.getByProject(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CostingCustomHeadDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CostingCustomHeadDto> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<CostingCustomHeadDto> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }
}
