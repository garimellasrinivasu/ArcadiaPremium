package com.arcadia.premium.controller;

import com.arcadia.premium.dto.WOTemplateDto;
import com.arcadia.premium.service.WOTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wo-templates")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SUPERVISOR') or @pageAccess.hasAccess(authentication, 'WO_TEMPLATE_SETTING')")
public class WOTemplateController {

    private final WOTemplateService service;

    public WOTemplateController(WOTemplateService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<WOTemplateDto> create(@RequestBody Map<String, Object> body, Authentication auth) {
        String createdBy = auth.getName();
        return ResponseEntity.ok(service.create(body, createdBy));
    }

    @GetMapping
    public ResponseEntity<List<WOTemplateDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<WOTemplateDto>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WOTemplateDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WOTemplateDto> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<WOTemplateDto> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }
}
