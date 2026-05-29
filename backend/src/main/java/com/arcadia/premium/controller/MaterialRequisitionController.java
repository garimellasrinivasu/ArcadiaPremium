package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateRequisitionRequest;
import com.arcadia.premium.dto.MaterialRequisitionDto;
import com.arcadia.premium.service.MaterialRequisitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/material-requisitions")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'MATERIAL_REQUISITION')")
public class MaterialRequisitionController {

    private final MaterialRequisitionService service;

    public MaterialRequisitionController(MaterialRequisitionService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MaterialRequisitionDto> create(@RequestBody CreateRequisitionRequest req,
                                                          Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<MaterialRequisitionDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaterialRequisitionDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<MaterialRequisitionDto>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(service.getByProject(projectId));
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<List<MaterialRequisitionDto>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(service.getByStatus(status));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MaterialRequisitionDto> updateStatus(@PathVariable Long id,
                                                                @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateStatus(id, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
