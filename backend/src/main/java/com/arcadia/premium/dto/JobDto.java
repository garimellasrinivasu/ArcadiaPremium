package com.arcadia.premium.dto;

import com.arcadia.premium.model.Job;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class JobDto {

    private Long id;
    private String name;
    private String description;
    private Long projectId;
    private String projectName;
    private String unitName;
    private String status;
    private List<Long> activityIds;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static JobDto fromEntity(Job e) {
        JobDto d = new JobDto();
        d.id = e.getId();
        d.name = e.getName();
        d.description = e.getDescription();
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        d.unitName = e.getUnitName();
        d.status = e.getStatus();
        if (e.getActivities() != null) {
            d.activityIds = e.getActivities().stream()
                    .map(a -> a.getId())
                    .collect(Collectors.toList());
        }
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
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getUnitName() { return unitName; }
    public void setUnitName(String unitName) { this.unitName = unitName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<Long> getActivityIds() { return activityIds; }
    public void setActivityIds(List<Long> activityIds) { this.activityIds = activityIds; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
