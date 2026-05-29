package com.arcadia.premium.controller;

import com.arcadia.premium.dto.WarehouseDto;
import com.arcadia.premium.service.WarehouseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warehouses")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'WAREHOUSE')")
public class WarehouseController {

    private final WarehouseService service;

    public WarehouseController(WarehouseService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<WarehouseDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<WarehouseDto>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<WarehouseDto>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(service.getByProject(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarehouseDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<WarehouseDto> create(@RequestBody WarehouseDto request,
                                               Authentication auth) {
        return ResponseEntity.ok(service.create(request, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WarehouseDto> update(@PathVariable Long id,
                                               @RequestBody WarehouseDto request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Warehouse deleted successfully"));
    }
}
