package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateWorkOrderRequest;
import com.arcadia.premium.dto.WorkOrderDto;
import com.arcadia.premium.service.WorkOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/work-orders")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'WORK_ORDERS')")
public class WorkOrderController {

    private final WorkOrderService service;

    public WorkOrderController(WorkOrderService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<WorkOrderDto> create(@RequestBody CreateWorkOrderRequest req, Authentication auth) {
        String createdBy = auth.getName();
        return ResponseEntity.ok(service.create(req, createdBy));
    }

    @GetMapping
    public ResponseEntity<List<WorkOrderDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-job")
    public ResponseEntity<List<WorkOrderDto>> getByJob(@RequestParam Long jobId) {
        return ResponseEntity.ok(service.getByJob(jobId));
    }

    @GetMapping("/by-contractor")
    public ResponseEntity<List<WorkOrderDto>> getByContractor(@RequestParam Long contractorId) {
        return ResponseEntity.ok(service.getByContractor(contractorId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrderDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<WorkOrderDto> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
