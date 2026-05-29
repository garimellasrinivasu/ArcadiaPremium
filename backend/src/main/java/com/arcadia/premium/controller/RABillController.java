package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateRABillRequest;
import com.arcadia.premium.dto.RABillDto;
import com.arcadia.premium.service.RABillService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ra-bills")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'RA_BILLS')")
public class RABillController {

    private final RABillService service;

    public RABillController(RABillService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<RABillDto> create(@RequestBody CreateRABillRequest req, Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<RABillDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RABillDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-work-order/{workOrderId}")
    public ResponseEntity<List<RABillDto>> getByWorkOrder(@PathVariable Long workOrderId) {
        return ResponseEntity.ok(service.getByWorkOrder(workOrderId));
    }

    @GetMapping("/by-contractor/{contractorId}")
    public ResponseEntity<List<RABillDto>> getByContractor(@PathVariable Long contractorId) {
        return ResponseEntity.ok(service.getByContractor(contractorId));
    }

    @GetMapping("/by-bill-type/{billType}")
    public ResponseEntity<List<RABillDto>> getByBillType(@PathVariable String billType) {
        return ResponseEntity.ok(service.getByBillType(billType));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<RABillDto> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateStatus(id, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
