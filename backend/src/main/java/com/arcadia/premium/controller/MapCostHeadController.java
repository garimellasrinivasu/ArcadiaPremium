package com.arcadia.premium.controller;

import com.arcadia.premium.dto.MapCostHeadDto;
import com.arcadia.premium.service.MapCostHeadService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/map-cost-heads")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SUPERVISOR') or @pageAccess.hasAccess(authentication, 'MAP_COST_HEAD')")
public class MapCostHeadController {

    private final MapCostHeadService service;

    public MapCostHeadController(MapCostHeadService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MapCostHeadDto> create(@RequestBody Map<String, Object> body, Authentication auth) {
        String createdBy = auth.getName();
        return ResponseEntity.ok(service.create(body, createdBy));
    }

    @GetMapping
    public ResponseEntity<List<MapCostHeadDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<MapCostHeadDto>> getByJob(@PathVariable Long jobId) {
        return ResponseEntity.ok(service.getByJob(jobId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MapCostHeadDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MapCostHeadDto> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<MapCostHeadDto> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }
}
