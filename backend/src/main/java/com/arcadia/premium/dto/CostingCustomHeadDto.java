package com.arcadia.premium.dto;

import com.arcadia.premium.model.CostingCustomHead;

import java.time.LocalDateTime;

public class CostingCustomHeadDto {

    private Long id;
    private String code;
    private String name;
    private String description;
    private Long standardHeadId;
    private String standardHeadName;
    private Long projectId;
    private String projectName;
    private boolean active;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CostingCustomHeadDto fromEntity(CostingCustomHead e) {
        CostingCustomHeadDto d = new CostingCustomHeadDto();
        d.id = e.getId();
        d.code = e.getCode();
        d.name = e.getName();
        d.description = e.getDescription();
        if (e.getStandardHead() != null) {
            d.standardHeadId = e.getStandardHead().getId();
            d.standardHeadName = e.getStandardHead().getName();
        }
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        d.active = e.isActive();
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getStandardHeadId() { return standardHeadId; }
    public void setStandardHeadId(Long standardHeadId) { this.standardHeadId = standardHeadId; }
    public String getStandardHeadName() { return standardHeadName; }
    public void setStandardHeadName(String standardHeadName) { this.standardHeadName = standardHeadName; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
