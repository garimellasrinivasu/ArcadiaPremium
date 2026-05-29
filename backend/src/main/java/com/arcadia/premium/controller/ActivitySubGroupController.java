package com.arcadia.premium.controller;

import com.arcadia.premium.dto.ActivitySubGroupDto;
import com.arcadia.premium.service.ActivitySubGroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity-sub-groups")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'ACTIVITY_MASTER')")
public class ActivitySubGroupController {

    private final ActivitySubGroupService service;

    public ActivitySubGroupController(ActivitySubGroupService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ActivitySubGroupDto> create(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        Long activityGroupId = ((Number) body.get("activityGroupId")).longValue();
        return ResponseEntity.ok(service.create(name, description, activityGroupId));
    }

    @GetMapping
    public ResponseEntity<List<ActivitySubGroupDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-group")
    public ResponseEntity<List<ActivitySubGroupDto>> getByGroupId(@RequestParam Long groupId) {
        return ResponseEntity.ok(service.getByGroupId(groupId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivitySubGroupDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActivitySubGroupDto> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        Long activityGroupId = ((Number) body.get("activityGroupId")).longValue();
        return ResponseEntity.ok(service.update(id, name, description, activityGroupId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
