package com.arcadia.premium.dto;

import com.arcadia.premium.model.MapCostHead;

import java.time.LocalDateTime;

public class MapCostHeadDto {

    private Long id;
    private Long jobId;
    private String jobName;
    private Long activityId;
    private String activityName;
    private Long standardHeadId;
    private String standardHeadName;
    private Long customHeadId;
    private String customHeadName;
    private boolean active;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MapCostHeadDto fromEntity(MapCostHead e) {
        MapCostHeadDto d = new MapCostHeadDto();
        d.id = e.getId();
        if (e.getJob() != null) {
            d.jobId = e.getJob().getId();
            d.jobName = e.getJob().getName();
        }
        if (e.getActivity() != null) {
            d.activityId = e.getActivity().getId();
            d.activityName = e.getActivity().getName();
        }
        if (e.getStandardHead() != null) {
            d.standardHeadId = e.getStandardHead().getId();
            d.standardHeadName = e.getStandardHead().getName();
        }
        if (e.getCustomHead() != null) {
            d.customHeadId = e.getCustomHead().getId();
            d.customHeadName = e.getCustomHead().getName();
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
    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }
    public String getJobName() { return jobName; }
    public void setJobName(String jobName) { this.jobName = jobName; }
    public Long getActivityId() { return activityId; }
    public void setActivityId(Long activityId) { this.activityId = activityId; }
    public String getActivityName() { return activityName; }
    public void setActivityName(String activityName) { this.activityName = activityName; }
    public Long getStandardHeadId() { return standardHeadId; }
    public void setStandardHeadId(Long standardHeadId) { this.standardHeadId = standardHeadId; }
    public String getStandardHeadName() { return standardHeadName; }
    public void setStandardHeadName(String standardHeadName) { this.standardHeadName = standardHeadName; }
    public Long getCustomHeadId() { return customHeadId; }
    public void setCustomHeadId(Long customHeadId) { this.customHeadId = customHeadId; }
    public String getCustomHeadName() { return customHeadName; }
    public void setCustomHeadName(String customHeadName) { this.customHeadName = customHeadName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
