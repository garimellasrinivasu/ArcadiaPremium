package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateIssueRequest;
import com.arcadia.premium.dto.MaterialIssueDto;
import com.arcadia.premium.service.MaterialIssueService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/material-issues")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'MATERIAL_ISSUE')")
public class MaterialIssueController {

    private final MaterialIssueService service;

    public MaterialIssueController(MaterialIssueService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MaterialIssueDto> create(@RequestBody CreateIssueRequest req, Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<MaterialIssueDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaterialIssueDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<MaterialIssueDto>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(service.getByProject(projectId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
