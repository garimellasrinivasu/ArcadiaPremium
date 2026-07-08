package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateInitialSaleRequest;
import com.arcadia.premium.dto.InitialSaleDto;
import com.arcadia.premium.service.InitialSaleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/initial-sales")
public class InitialSaleController {

    private final InitialSaleService service;

    public InitialSaleController(InitialSaleService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<InitialSaleDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InitialSaleDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/project/{projectName}")
    public ResponseEntity<List<InitialSaleDto>> getByProject(@PathVariable String projectName) {
        return ResponseEntity.ok(service.getByProject(projectName));
    }

    @GetMapping("/search")
    public ResponseEntity<List<InitialSaleDto>> search(@RequestParam("name") String name) {
        return ResponseEntity.ok(service.search(name));
    }

    @PostMapping
    public ResponseEntity<InitialSaleDto> create(@Valid @RequestBody CreateInitialSaleRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InitialSaleDto> update(@PathVariable Long id, @Valid @RequestBody CreateInitialSaleRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Initial sale deleted successfully"));
    }
}
