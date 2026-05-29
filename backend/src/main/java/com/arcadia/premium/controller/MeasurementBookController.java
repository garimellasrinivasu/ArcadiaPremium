package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateMBRequest;
import com.arcadia.premium.dto.MeasurementBookDto;
import com.arcadia.premium.service.MeasurementBookService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/measurement-books")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'MEASUREMENT_BOOK')")
public class MeasurementBookController {

    private final MeasurementBookService service;

    public MeasurementBookController(MeasurementBookService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MeasurementBookDto> create(@RequestBody CreateMBRequest req, Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<MeasurementBookDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeasurementBookDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-work-order/{workOrderId}")
    public ResponseEntity<List<MeasurementBookDto>> getByWorkOrder(@PathVariable Long workOrderId) {
        return ResponseEntity.ok(service.getByWorkOrder(workOrderId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MeasurementBookDto> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateStatus(id, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
