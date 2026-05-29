package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateMRNRequest;
import com.arcadia.premium.dto.MRNDto;
import com.arcadia.premium.service.MRNService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mrns")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'MRN')")
public class MRNController {

    private final MRNService service;

    public MRNController(MRNService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MRNDto> create(@RequestBody CreateMRNRequest req, Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<MRNDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MRNDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-purchase-order/{poId}")
    public ResponseEntity<List<MRNDto>> getByPurchaseOrder(@PathVariable Long poId) {
        return ResponseEntity.ok(service.getByPurchaseOrder(poId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MRNDto> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateStatus(id, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
