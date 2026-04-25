package com.arcadia.premium.dto;

import com.arcadia.premium.model.Role;

import java.util.List;
import java.util.stream.Collectors;

public class RoleDto {
    private Long id;
    private String name;
    private String description;
    private List<PermissionDto> permissions;

    public static RoleDto fromEntity(Role role) {
        RoleDto dto = new RoleDto();
        dto.id = role.getId();
        dto.name = role.getName();
        dto.description = role.getDescription();
        dto.permissions = role.getPermissions().stream()
                .map(PermissionDto::fromEntity)
                .collect(Collectors.toList());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<PermissionDto> getPermissions() { return permissions; }
    public void setPermissions(List<PermissionDto> permissions) { this.permissions = permissions; }
}
