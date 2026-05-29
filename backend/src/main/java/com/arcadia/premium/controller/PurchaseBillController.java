package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreatePurchaseBillRequest;
import com.arcadia.premium.dto.PurchaseBillDto;
import com.arcadia.premium.service.PurchaseBillService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-bills")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'PURCHASE_BILL')")
public class PurchaseBillController {

    private final PurchaseBillService service;

    public PurchaseBillController(PurchaseBillService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<PurchaseBillDto> create(@RequestBody CreatePurchaseBillRequest req, Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<PurchaseBillDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseBillDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-purchase-order/{poId}")
    public ResponseEntity<List<PurchaseBillDto>> getByPurchaseOrder(@PathVariable Long poId) {
        return ResponseEntity.ok(service.getByPurchaseOrder(poId));
    }

    @GetMapping("/by-vendor/{vendorId}")
    public ResponseEntity<List<PurchaseBillDto>> getByVendor(@PathVariable Long vendorId) {
        return ResponseEntity.ok(service.getByVendor(vendorId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PurchaseBillDto> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateStatus(id, body.get("status")));
    }

    @PutMapping("/{id}/upload-invoice")
    public ResponseEntity<PurchaseBillDto> uploadInvoice(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.uploadInvoice(id, body.get("file"), body.get("fileName")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
