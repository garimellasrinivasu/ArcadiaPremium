package com.arcadia.premium.controller;

import com.arcadia.premium.dto.ActivityMasterDto;
import com.arcadia.premium.service.ActivityMasterService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activities")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'ACTIVITY_MASTER')")
public class ActivityMasterController {

    private final ActivityMasterService service;

    public ActivityMasterController(ActivityMasterService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ActivityMasterDto> create(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        Long activityGroupId = ((Number) body.get("activityGroupId")).longValue();
        Long activitySubGroupId = body.get("activitySubGroupId") != null
                ? ((Number) body.get("activitySubGroupId")).longValue() : null;
        String uom = (String) body.get("uom");
        String sacCode = (String) body.get("sacCode");
        return ResponseEntity.ok(service.create(name, description, activityGroupId, activitySubGroupId, uom, sacCode));
    }

    @GetMapping
    public ResponseEntity<List<ActivityMasterDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ActivityMasterDto>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/by-group")
    public ResponseEntity<List<ActivityMasterDto>> getByGroupId(@RequestParam Long groupId) {
        return ResponseEntity.ok(service.getByGroupId(groupId));
    }

    @GetMapping("/by-sub-group")
    public ResponseEntity<List<ActivityMasterDto>> getBySubGroupId(@RequestParam Long subGroupId) {
        return ResponseEntity.ok(service.getBySubGroupId(subGroupId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityMasterDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActivityMasterDto> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        Long activityGroupId = ((Number) body.get("activityGroupId")).longValue();
        Long activitySubGroupId = body.get("activitySubGroupId") != null
                ? ((Number) body.get("activitySubGroupId")).longValue() : null;
        String uom = (String) body.get("uom");
        String sacCode = (String) body.get("sacCode");
        return ResponseEntity.ok(service.update(id, name, description, activityGroupId, activitySubGroupId, uom, sacCode));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
