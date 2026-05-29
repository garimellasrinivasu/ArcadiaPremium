package com.arcadia.premium.controller;

import com.arcadia.premium.dto.ExecutionTemplateDto;
import com.arcadia.premium.service.ExecutionTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/execution-templates")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SUPERVISOR') or @pageAccess.hasAccess(authentication, 'PROJ_EXECUTION_TEMPLATE')")
public class ExecutionTemplateController {

    private final ExecutionTemplateService service;

    public ExecutionTemplateController(ExecutionTemplateService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ExecutionTemplateDto> create(
            @RequestBody Map<String, Object> req,
            Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<ExecutionTemplateDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<ExecutionTemplateDto>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(service.getByProject(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExecutionTemplateDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
