package com.arcadia.premium.controller;

import com.arcadia.premium.dto.RABillPaymentCertificateDto;
import com.arcadia.premium.service.RABillPaymentCertificateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ra-bill-payments")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'RA_BILL_PAYMENT_CERT')")
public class RABillPaymentCertificateController {

    private final RABillPaymentCertificateService service;

    public RABillPaymentCertificateController(RABillPaymentCertificateService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<RABillPaymentCertificateDto> create(@RequestBody Map<String, Object> req, Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<RABillPaymentCertificateDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RABillPaymentCertificateDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-contractor/{contractorId}")
    public ResponseEntity<List<RABillPaymentCertificateDto>> getByContractor(@PathVariable Long contractorId) {
        return ResponseEntity.ok(service.getByContractor(contractorId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<RABillPaymentCertificateDto> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateStatus(id, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
