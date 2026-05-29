package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateJobRequest;
import com.arcadia.premium.dto.JobDto;
import com.arcadia.premium.service.JobService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'JOBS_WBS')")
public class JobController {

    private final JobService service;

    public JobController(JobService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<JobDto> create(@RequestBody CreateJobRequest req, Authentication auth) {
        String createdBy = auth.getName();
        return ResponseEntity.ok(service.create(req, createdBy));
    }

    @GetMapping
    public ResponseEntity<List<JobDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-project")
    public ResponseEntity<List<JobDto>> getByProject(@RequestParam Long projectId) {
        return ResponseEntity.ok(service.getByProject(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobDto> update(@PathVariable Long id, @RequestBody CreateJobRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<JobDto> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
