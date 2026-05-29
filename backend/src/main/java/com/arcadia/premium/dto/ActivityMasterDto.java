package com.arcadia.premium.dto;

import com.arcadia.premium.model.ActivityMaster;

import java.time.LocalDateTime;

public class ActivityMasterDto {

    private Long id;
    private String name;
    private String description;
    private Long activityGroupId;
    private String activityGroupName;
    private Long activitySubGroupId;
    private String activitySubGroupName;
    private String uom;
    private String sacCode;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ActivityMasterDto fromEntity(ActivityMaster e) {
        ActivityMasterDto d = new ActivityMasterDto();
        d.id = e.getId();
        d.name = e.getName();
        d.description = e.getDescription();
        if (e.getActivityGroup() != null) {
            d.activityGroupId = e.getActivityGroup().getId();
            d.activityGroupName = e.getActivityGroup().getName();
        }
        if (e.getActivitySubGroup() != null) {
            d.activitySubGroupId = e.getActivitySubGroup().getId();
            d.activitySubGroupName = e.getActivitySubGroup().getName();
        }
        d.uom = e.getUom();
        d.sacCode = e.getSacCode();
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
    public Long getActivitySubGroupId() { return activitySubGroupId; }
    public void setActivitySubGroupId(Long activitySubGroupId) { this.activitySubGroupId = activitySubGroupId; }
    public String getActivitySubGroupName() { return activitySubGroupName; }
    public void setActivitySubGroupName(String activitySubGroupName) { this.activitySubGroupName = activitySubGroupName; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public String getSacCode() { return sacCode; }
    public void setSacCode(String sacCode) { this.sacCode = sacCode; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
