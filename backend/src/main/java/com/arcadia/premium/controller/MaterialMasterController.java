package com.arcadia.premium.controller;

import com.arcadia.premium.dto.MaterialMasterDto;
import com.arcadia.premium.service.MaterialMasterService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/materials")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'MATERIAL_MASTER')")
public class MaterialMasterController {

    private final MaterialMasterService service;

    public MaterialMasterController(MaterialMasterService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MaterialMasterDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<MaterialMasterDto>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/by-group/{groupId}")
    public ResponseEntity<List<MaterialMasterDto>> getByGroupId(@PathVariable Long groupId) {
        return ResponseEntity.ok(service.getByGroupId(groupId));
    }

    @GetMapping("/by-sub-group/{subGroupId}")
    public ResponseEntity<List<MaterialMasterDto>> getBySubGroupId(@PathVariable Long subGroupId) {
        return ResponseEntity.ok(service.getBySubGroupId(subGroupId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaterialMasterDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<MaterialMasterDto> create(@RequestBody MaterialMasterDto request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaterialMasterDto> update(@PathVariable Long id,
                                                    @RequestBody MaterialMasterDto request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Material deleted successfully"));
    }
}
