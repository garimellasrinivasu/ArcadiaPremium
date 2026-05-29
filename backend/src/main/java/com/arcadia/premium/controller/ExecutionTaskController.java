package com.arcadia.premium.controller;

import com.arcadia.premium.dto.ExecutionTaskDto;
import com.arcadia.premium.service.ExecutionTaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/execution-tasks")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SUPERVISOR') or @pageAccess.hasAccess(authentication, 'EXECUTION_TASKS')")
public class ExecutionTaskController {

    private final ExecutionTaskService service;

    public ExecutionTaskController(ExecutionTaskService service) {
        this.service = service;
    }

    /** Create a single ad-hoc task */
    @PostMapping
    public ResponseEntity<ExecutionTaskDto> createSingle(
            @RequestBody Map<String, Object> req,
            Authentication auth) {
        return ResponseEntity.ok(service.createSingle(req, auth.getName()));
    }

    /** Allocate tasks from a template to a unit/block */
    @PostMapping("/from-template")
    public ResponseEntity<List<ExecutionTaskDto>> allocateFromTemplate(
            @RequestBody Map<String, Object> req,
            Authentication auth) {
        return ResponseEntity.ok(service.allocateFromTemplate(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<ExecutionTaskDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<ExecutionTaskDto>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(service.getByProject(projectId));
    }

    @GetMapping("/by-assignee/{username}")
    public ResponseEntity<List<ExecutionTaskDto>> getByAssignee(@PathVariable String username) {
        return ResponseEntity.ok(service.getByAssignee(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExecutionTaskDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ExecutionTaskDto> updateStatus(@PathVariable Long id,
                                                          @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateStatus(id, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
