package com.arcadia.premium.controller;

import com.arcadia.premium.dto.MastriLeaderDto;
import com.arcadia.premium.service.MastriLeaderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mastri-leaders")
public class MastriLeaderController {

    private final MastriLeaderService service;

    public MastriLeaderController(MastriLeaderService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MastriLeaderDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<MastriLeaderDto>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MastriLeaderDto> create(@RequestBody MastriLeaderDto dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MastriLeaderDto> update(@PathVariable Long id,
                                                   @RequestBody MastriLeaderDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
