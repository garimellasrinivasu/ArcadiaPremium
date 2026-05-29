package com.arcadia.premium.controller;

import com.arcadia.premium.dto.MaterialRateDto;
import com.arcadia.premium.service.MaterialRateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/material-rates")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'MATERIAL_RATE')")
public class MaterialRateController {

    private final MaterialRateService service;

    public MaterialRateController(MaterialRateService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MaterialRateDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-material/{materialId}")
    public ResponseEntity<List<MaterialRateDto>> getByMaterial(@PathVariable Long materialId) {
        return ResponseEntity.ok(service.getByMaterial(materialId));
    }

    @PostMapping
    public ResponseEntity<MaterialRateDto> addRate(@RequestBody Map<String, Object> body,
                                                   Authentication auth) {
        Long vendorId = Long.valueOf(body.get("vendorId").toString());
        Long materialId = Long.valueOf(body.get("materialId").toString());
        BigDecimal rate = new BigDecimal(body.get("rate").toString());
        LocalDate rateDate = LocalDate.parse(body.get("rateDate").toString());
        Double taxPercent = body.get("taxPercent") != null ? Double.valueOf(body.get("taxPercent").toString()) : null;
        String taxType = body.get("taxType") != null ? body.get("taxType").toString() : null;
        String remarks = body.get("remarks") != null ? body.get("remarks").toString() : null;

        return ResponseEntity.ok(service.addRate(vendorId, materialId, rate, rateDate,
                taxPercent, taxType, remarks, auth.getName()));
    }

    @GetMapping("/by-vendor-material")
    public ResponseEntity<List<MaterialRateDto>> getByVendorAndMaterial(
            @RequestParam Long vendorId, @RequestParam Long materialId) {
        return ResponseEntity.ok(service.getByVendorAndMaterial(vendorId, materialId));
    }

    @GetMapping("/by-vendor/{vendorId}")
    public ResponseEntity<List<MaterialRateDto>> getByVendor(@PathVariable Long vendorId) {
        return ResponseEntity.ok(service.getByVendor(vendorId));
    }

    @GetMapping("/latest-approved/{materialId}")
    public ResponseEntity<MaterialRateDto> getLatestApproved(@PathVariable Long materialId) {
        MaterialRateDto rate = service.getLatestApprovedRate(materialId);
        if (rate == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(rate);
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<MaterialRateDto> submit(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(service.submitRate(id, auth.getName()));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<MaterialRateDto> approve(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(service.approveRate(id, auth.getName()));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<MaterialRateDto> reject(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        return ResponseEntity.ok(service.rejectRate(id, auth.getName(), body.get("rejectionReason")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Material rate deleted successfully"));
    }
}
