package com.arcadia.premium.controller;

import com.arcadia.premium.dto.MaterialGroupDto;
import com.arcadia.premium.service.MaterialGroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/material-groups")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'MATERIAL_MASTER')")
public class MaterialGroupController {

    private final MaterialGroupService service;

    public MaterialGroupController(MaterialGroupService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MaterialGroupDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<MaterialGroupDto>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaterialGroupDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<MaterialGroupDto> create(@RequestBody MaterialGroupDto request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaterialGroupDto> update(@PathVariable Long id,
                                                   @RequestBody MaterialGroupDto request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<MaterialGroupDto> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Material group deleted successfully"));
    }
}
