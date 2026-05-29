package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CreateJobRequest {

    @NotBlank(message = "Job name is required")
    private String name;

    private String description;

    @NotNull(message = "Project is required")
    private Long projectId;

    private String unitName;

    private List<Long> activityIds;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getUnitName() { return unitName; }
    public void setUnitName(String unitName) { this.unitName = unitName; }
    public List<Long> getActivityIds() { return activityIds; }
    public void setActivityIds(List<Long> activityIds) { this.activityIds = activityIds; }
}
