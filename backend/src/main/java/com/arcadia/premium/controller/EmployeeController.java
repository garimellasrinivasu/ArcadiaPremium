package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateEmployeeRequest;
import com.arcadia.premium.dto.EmployeeDto;
import com.arcadia.premium.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService service;

    public EmployeeController(EmployeeService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<?> create(@Valid @RequestBody CreateEmployeeRequest req) {
        try {
            EmployeeDto dto = service.create(req);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<List<EmployeeDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody CreateEmployeeRequest req) {
        try {
            EmployeeDto dto = service.update(id, req);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<?> deactivate(@PathVariable Long id) {
        try {
            service.deactivate(id);
            return ResponseEntity.ok(Map.of("message", "Employee deactivated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
