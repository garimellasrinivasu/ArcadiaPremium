package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateGRNRequest;
import com.arcadia.premium.dto.GRNDto;
import com.arcadia.premium.service.GRNService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grns")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'GRN')")
public class GRNController {

    private final GRNService service;

    public GRNController(GRNService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<GRNDto> create(@RequestBody CreateGRNRequest req, Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<GRNDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GRNDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-mrn/{mrnId}")
    public ResponseEntity<List<GRNDto>> getByMrn(@PathVariable Long mrnId) {
        return ResponseEntity.ok(service.getByMrn(mrnId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
