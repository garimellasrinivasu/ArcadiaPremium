package com.arcadia.premium.dto;

import com.arcadia.premium.model.MaterialSubGroup;

import java.time.LocalDateTime;

public class MaterialSubGroupDto {
    private Long id;
    private String name;
    private String description;
    private Long materialGroupId;
    private String materialGroupName;
    private Double tolerancePercent;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MaterialSubGroupDto fromEntity(MaterialSubGroup e) {
        MaterialSubGroupDto d = new MaterialSubGroupDto();
        d.id = e.getId();
        d.name = e.getName();
        d.description = e.getDescription();
        if (e.getMaterialGroup() != null) {
            d.materialGroupId = e.getMaterialGroup().getId();
            d.materialGroupName = e.getMaterialGroup().getName();
        }
        d.tolerancePercent = e.getTolerancePercent();
        d.active = e.isActive();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getMaterialGroupId() { return materialGroupId; }
    public void setMaterialGroupId(Long materialGroupId) { this.materialGroupId = materialGroupId; }
    public String getMaterialGroupName() { return materialGroupName; }
    public void setMaterialGroupName(String materialGroupName) { this.materialGroupName = materialGroupName; }
    public Double getTolerancePercent() { return tolerancePercent; }
    public void setTolerancePercent(Double tolerancePercent) { this.tolerancePercent = tolerancePercent; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
