package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreatePujaExpenseRequest;
import com.arcadia.premium.dto.PujaExpenseDto;
import com.arcadia.premium.service.PujaExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/puja-expenses")
public class PujaExpenseController {

    private final PujaExpenseService service;

    public PujaExpenseController(PujaExpenseService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PUJA_EXPENSES')")
    public ResponseEntity<?> create(@Valid @RequestBody CreatePujaExpenseRequest req, Principal principal) {
        try {
            PujaExpenseDto dto = service.create(req, principal.getName());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PUJA_EXPENSES')")
    public ResponseEntity<List<PujaExpenseDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-puja")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PUJA_EXPENSES')")
    public ResponseEntity<List<PujaExpenseDto>> getByPujaName(@RequestParam String pujaName) {
        return ResponseEntity.ok(service.getByPujaName(pujaName));
    }

    @GetMapping("/by-project")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PUJA_EXPENSES')")
    public ResponseEntity<List<PujaExpenseDto>> getByProject(@RequestParam String projectName) {
        return ResponseEntity.ok(service.getByProject(projectName));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PUJA_EXPENSES')")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody CreatePujaExpenseRequest req) {
        try {
            PujaExpenseDto dto = service.update(id, req);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PUJA_EXPENSES')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
