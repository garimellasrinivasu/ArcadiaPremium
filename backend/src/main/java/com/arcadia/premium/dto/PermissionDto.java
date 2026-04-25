package com.arcadia.premium.dto;

import com.arcadia.premium.model.Permission;

public class PermissionDto {
    private Long id;
    private String name;
    private String description;
    private String module;

    public static PermissionDto fromEntity(Permission permission) {
        PermissionDto dto = new PermissionDto();
        dto.id = permission.getId();
        dto.name = permission.getName();
        dto.description = permission.getDescription();
        dto.module = permission.getModule();
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }
}
