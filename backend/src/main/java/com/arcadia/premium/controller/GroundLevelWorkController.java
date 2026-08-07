package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateGroundLevelWorkRequest;
import com.arcadia.premium.dto.GroundLevelWorkDto;
import com.arcadia.premium.service.GroundLevelWorkService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ground-level-work")
public class GroundLevelWorkController {

    private final GroundLevelWorkService service;

    public GroundLevelWorkController(GroundLevelWorkService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'GROUND_LEVEL_WORK')")
    public ResponseEntity<?> create(@Valid @RequestBody CreateGroundLevelWorkRequest req, Principal principal) {
        try {
            GroundLevelWorkDto dto = service.create(req, principal.getName());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'GROUND_LEVEL_WORK')")
    public ResponseEntity<List<GroundLevelWorkDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-project")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'GROUND_LEVEL_WORK')")
    public ResponseEntity<List<GroundLevelWorkDto>> getByProject(@RequestParam String projectName) {
        return ResponseEntity.ok(service.getByProject(projectName));
    }

    @GetMapping("/by-project-month")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'GROUND_LEVEL_WORK')")
    public ResponseEntity<List<GroundLevelWorkDto>> getByProjectAndMonth(
            @RequestParam String projectName, @RequestParam String billMonth) {
        return ResponseEntity.ok(service.getByProjectAndMonth(projectName, billMonth));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'GROUND_LEVEL_WORK')")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody CreateGroundLevelWorkRequest req) {
        try {
            GroundLevelWorkDto dto = service.update(id, req);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'GROUND_LEVEL_WORK')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
