package com.arcadia.premium.dto;

import com.arcadia.premium.model.Warehouse;

import java.time.LocalDateTime;

public class WarehouseDto {
    private Long id;
    private String name;
    private Long projectId;
    private String projectName;
    private String location;
    private String description;
    private boolean active;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WarehouseDto fromEntity(Warehouse e) {
        WarehouseDto d = new WarehouseDto();
        d.id = e.getId();
        d.name = e.getName();
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        d.location = e.getLocation();
        d.description = e.getDescription();
        d.active = e.isActive();
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
