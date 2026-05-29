package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateIndentRequest;
import com.arcadia.premium.dto.MaterialIndentDto;
import com.arcadia.premium.service.MaterialIndentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/material-indents")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'MATERIAL_INDENT')")
public class MaterialIndentController {

    private final MaterialIndentService service;

    public MaterialIndentController(MaterialIndentService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MaterialIndentDto> create(@RequestBody CreateIndentRequest req, Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<MaterialIndentDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaterialIndentDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<MaterialIndentDto>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(service.getByProject(projectId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MaterialIndentDto> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateStatus(id, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
