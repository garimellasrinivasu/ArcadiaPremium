package com.arcadia.premium.service;

import com.arcadia.premium.dto.PermissionDto;
import com.arcadia.premium.dto.RoleDto;
import com.arcadia.premium.model.Permission;
import com.arcadia.premium.model.Role;
import com.arcadia.premium.repository.PermissionRepository;
import com.arcadia.premium.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public RoleService(RoleRepository roleRepository, PermissionRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    public List<RoleDto> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(RoleDto::fromEntity)
                .collect(Collectors.toList());
    }

    public RoleDto getRoleById(Long id) {
        return roleRepository.findById(id)
                .map(RoleDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
    }

    public List<PermissionDto> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(PermissionDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoleDto createRole(String name, String description, List<Long> permissionIds) {
        if (roleRepository.findByName(name).isPresent()) {
            throw new RuntimeException("Role with name '" + name + "' already exists");
        }
        Role role = new Role();
        role.setName(name.toUpperCase().replace(" ", "_"));
        role.setDescription(description);
        if (permissionIds != null && !permissionIds.isEmpty()) {
            Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(permissionIds));
            role.setPermissions(permissions);
        }
        return RoleDto.fromEntity(roleRepository.save(role));
    }

    @Transactional
    public RoleDto updateRole(Long id, String name, String description, List<Long> permissionIds) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        if (name != null && !name.isBlank()) {
            String normalizedName = name.toUpperCase().replace(" ", "_");
            // Check if another role already has this name
            roleRepository.findByName(normalizedName).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new RuntimeException("Role with name '" + normalizedName + "' already exists");
                }
            });
            role.setName(normalizedName);
        }
        if (description != null) {
            role.setDescription(description);
        }
        if (permissionIds != null) {
            Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(permissionIds));
            role.setPermissions(permissions);
        }
        return RoleDto.fromEntity(roleRepository.save(role));
    }

    @Transactional
    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        roleRepository.delete(role);
    }
}
