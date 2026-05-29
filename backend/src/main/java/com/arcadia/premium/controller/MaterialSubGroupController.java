package com.arcadia.premium.controller;

import com.arcadia.premium.dto.MaterialSubGroupDto;
import com.arcadia.premium.service.MaterialSubGroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/material-sub-groups")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'MATERIAL_MASTER')")
public class MaterialSubGroupController {

    private final MaterialSubGroupService service;

    public MaterialSubGroupController(MaterialSubGroupService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MaterialSubGroupDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-group/{groupId}")
    public ResponseEntity<List<MaterialSubGroupDto>> getByGroupId(@PathVariable Long groupId) {
        return ResponseEntity.ok(service.getByGroupId(groupId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaterialSubGroupDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<MaterialSubGroupDto> create(@RequestBody MaterialSubGroupDto request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaterialSubGroupDto> update(@PathVariable Long id,
                                                      @RequestBody MaterialSubGroupDto request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Material sub-group deleted successfully"));
    }
}
