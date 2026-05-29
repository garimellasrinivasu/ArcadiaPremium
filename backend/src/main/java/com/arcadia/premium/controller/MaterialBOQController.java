package com.arcadia.premium.controller;

import com.arcadia.premium.dto.MaterialBOQDto;
import com.arcadia.premium.service.MaterialBOQService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/material-boq")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'MATERIAL_BOQ')")
public class MaterialBOQController {

    private final MaterialBOQService service;

    public MaterialBOQController(MaterialBOQService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MaterialBOQDto> create(@RequestBody MaterialBOQDto request,
                                                 Authentication auth) {
        return ResponseEntity.ok(service.create(request, auth.getName()));
    }

    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<MaterialBOQDto>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(service.getByProject(projectId));
    }

    @GetMapping("/by-project/{projectId}/unit")
    public ResponseEntity<List<MaterialBOQDto>> getByProjectAndUnit(
            @PathVariable Long projectId, @RequestParam String unitName) {
        return ResponseEntity.ok(service.getByProjectAndUnit(projectId, unitName));
    }

    @GetMapping("/by-material/{materialId}")
    public ResponseEntity<List<MaterialBOQDto>> getByMaterial(@PathVariable Long materialId) {
        return ResponseEntity.ok(service.getByMaterial(materialId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaterialBOQDto> update(@PathVariable Long id,
                                                 @RequestBody MaterialBOQDto request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<MaterialBOQDto> approve(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(service.approve(id, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Material BOQ deleted successfully"));
    }
}
