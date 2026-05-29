package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateVendorRequest;
import com.arcadia.premium.dto.VendorDto;
import com.arcadia.premium.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendors")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'VENDOR_LIST')")
public class VendorController {

    private final VendorService service;

    public VendorController(VendorService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<VendorDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<VendorDto>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/search")
    public ResponseEntity<List<VendorDto>> search(@RequestParam String q) {
        return ResponseEntity.ok(service.search(q));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendorDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<VendorDto> create(@Valid @RequestBody CreateVendorRequest request,
                                            Authentication auth) {
        return ResponseEntity.ok(service.create(request, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VendorDto> update(@PathVariable Long id,
                                            @Valid @RequestBody CreateVendorRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<VendorDto> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Vendor deleted successfully"));
    }
}
