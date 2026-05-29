package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateJobEstimationRequest;
import com.arcadia.premium.dto.JobEstimationDto;
import com.arcadia.premium.service.JobEstimationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job-estimations")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'JOB_ESTIMATION')")
public class JobEstimationController {

    private final JobEstimationService service;

    public JobEstimationController(JobEstimationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<JobEstimationDto> create(@RequestBody CreateJobEstimationRequest req, Authentication auth) {
        String createdBy = auth.getName();
        return ResponseEntity.ok(service.create(req, createdBy));
    }

    @GetMapping("/by-job")
    public ResponseEntity<List<JobEstimationDto>> getByJob(@RequestParam Long jobId) {
        return ResponseEntity.ok(service.getByJob(jobId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobEstimationDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobEstimationDto> update(@PathVariable Long id, @RequestBody CreateJobEstimationRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
