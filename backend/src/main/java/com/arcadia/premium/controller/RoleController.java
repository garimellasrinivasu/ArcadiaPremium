package com.arcadia.premium.controller;

import com.arcadia.premium.dto.PermissionDto;
import com.arcadia.premium.dto.RoleDto;
import com.arcadia.premium.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER')")
    public ResponseEntity<List<RoleDto>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER')")
    public ResponseEntity<RoleDto> getRoleById(@PathVariable Long id) {
        return ResponseEntity.ok(roleService.getRoleById(id));
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER')")
    public ResponseEntity<List<PermissionDto>> getAllPermissions() {
        return ResponseEntity.ok(roleService.getAllPermissions());
    }

    @SuppressWarnings("unchecked")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER')")
    public ResponseEntity<RoleDto> createRole(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        List<Long> permissionIds = body.get("permissionIds") != null
                ? ((List<Number>) body.get("permissionIds")).stream().map(Number::longValue).toList()
                : null;
        return ResponseEntity.ok(roleService.createRole(name, description, permissionIds));
    }

    @SuppressWarnings("unchecked")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER')")
    public ResponseEntity<RoleDto> updateRole(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        List<Long> permissionIds = body.get("permissionIds") != null
                ? ((List<Number>) body.get("permissionIds")).stream().map(Number::longValue).toList()
                : null;
        return ResponseEntity.ok(roleService.updateRole(id, name, description, permissionIds));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER')")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }
}
