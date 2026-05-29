package com.arcadia.premium.controller;

import com.arcadia.premium.dto.VendorMaterialMappingDto;
import com.arcadia.premium.service.VendorMaterialMappingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor-material-mappings")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'VENDOR_MATERIAL_MAP')")
public class VendorMaterialMappingController {

    private final VendorMaterialMappingService service;

    public VendorMaterialMappingController(VendorMaterialMappingService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<VendorMaterialMappingDto> create(@RequestBody Map<String, Long> body) {
        Long vendorId = body.get("vendorId");
        Long materialId = body.get("materialId");
        return ResponseEntity.ok(service.create(vendorId, materialId));
    }

    @GetMapping("/by-vendor/{vendorId}")
    public ResponseEntity<List<VendorMaterialMappingDto>> getByVendor(@PathVariable Long vendorId) {
        return ResponseEntity.ok(service.getByVendor(vendorId));
    }

    @GetMapping("/by-material/{materialId}")
    public ResponseEntity<List<VendorMaterialMappingDto>> getByMaterial(@PathVariable Long materialId) {
        return ResponseEntity.ok(service.getByMaterial(materialId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Vendor-material mapping deleted successfully"));
    }
}
