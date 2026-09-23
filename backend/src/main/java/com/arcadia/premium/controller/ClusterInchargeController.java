package com.arcadia.premium.controller;

import com.arcadia.premium.dto.ClusterInchargeDto;
import com.arcadia.premium.service.ClusterInchargeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cluster-incharges")
public class ClusterInchargeController {

    private final ClusterInchargeService service;

    public ClusterInchargeController(ClusterInchargeService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ClusterInchargeDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ClusterInchargeDto>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClusterInchargeDto> create(@RequestBody ClusterInchargeDto dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClusterInchargeDto> update(@PathVariable Long id,
                                                      @RequestBody ClusterInchargeDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
