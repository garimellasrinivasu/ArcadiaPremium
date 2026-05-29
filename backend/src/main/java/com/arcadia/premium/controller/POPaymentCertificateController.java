package com.arcadia.premium.controller;

import com.arcadia.premium.dto.POPaymentCertificateDto;
import com.arcadia.premium.service.POPaymentCertificateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/po-payment-certificates")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'PO_PAYMENT_CERT')")
public class POPaymentCertificateController {

    private final POPaymentCertificateService service;

    public POPaymentCertificateController(POPaymentCertificateService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<POPaymentCertificateDto> create(@RequestBody Map<String, Object> req, Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<POPaymentCertificateDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<POPaymentCertificateDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-vendor/{vendorId}")
    public ResponseEntity<List<POPaymentCertificateDto>> getByVendor(@PathVariable Long vendorId) {
        return ResponseEntity.ok(service.getByVendor(vendorId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<POPaymentCertificateDto> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateStatus(id, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
