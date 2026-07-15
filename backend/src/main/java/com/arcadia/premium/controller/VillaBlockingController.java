package com.arcadia.premium.controller;

import com.arcadia.premium.dto.VillaBlockingDto;
import com.arcadia.premium.service.VillaBlockingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/villa-blocking")
public class VillaBlockingController {

    private final VillaBlockingService service;

    public VillaBlockingController(VillaBlockingService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<VillaBlockingDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{villaNumber}")
    public ResponseEntity<VillaBlockingDto> getByVillaNumber(@PathVariable Integer villaNumber) {
        return service.getByVillaNumber(villaNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'MASTER_PLAN')")
    public ResponseEntity<VillaBlockingDto> blockVilla(@RequestBody VillaBlockingDto dto,
                                                       Authentication auth) {
        dto.setBlockedBy(auth.getName());
        return ResponseEntity.ok(service.blockVilla(dto));
    }

    @PutMapping("/{villaNumber}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'MASTER_PLAN')")
    public ResponseEntity<VillaBlockingDto> updateBlockedVilla(@PathVariable Integer villaNumber,
                                                                @RequestBody VillaBlockingDto dto) {
        return ResponseEntity.ok(service.updateBlockedVilla(villaNumber, dto));
    }

    @DeleteMapping("/{villaNumber}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'MASTER_PLAN')")
    public ResponseEntity<Map<String, String>> unblockVilla(@PathVariable Integer villaNumber) {
        service.unblockVilla(villaNumber);
        return ResponseEntity.ok(Map.of("message", "Villa " + villaNumber + " unblocked successfully"));
    }
}
