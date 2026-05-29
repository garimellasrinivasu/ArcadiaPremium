package com.arcadia.premium.dto;

import com.arcadia.premium.model.ActivitySubGroup;

import java.time.LocalDateTime;

public class ActivitySubGroupDto {

    private Long id;
    private String name;
    private String description;
    private Long activityGroupId;
    private String activityGroupName;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ActivitySubGroupDto fromEntity(ActivitySubGroup e) {
        ActivitySubGroupDto d = new ActivitySubGroupDto();
        d.id = e.getId();
        d.name = e.getName();
        d.description = e.getDescription();
        if (e.getActivityGroup() != null) {
            d.activityGroupId = e.getActivityGroup().getId();
            d.activityGroupName = e.getActivityGroup().getName();
        }
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
    public Long getActivityGroupId() { return activityGroupId; }
    public void setActivityGroupId(Long activityGroupId) { this.activityGroupId = activityGroupId; }
    public String getActivityGroupName() { return activityGroupName; }
    public void setActivityGroupName(String activityGroupName) { this.activityGroupName = activityGroupName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
