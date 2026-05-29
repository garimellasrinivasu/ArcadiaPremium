package com.arcadia.premium.dto;

import com.arcadia.premium.model.RateAnalysis;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class RateAnalysisDto {

    private Long id;
    private Long projectId;
    private String projectName;
    private Long activityId;
    private String activityName;
    private String rateType;
    private BigDecimal unitRate;
    private String status;
    private String remarks;
    private List<RateAnalysisItemDto> items = new ArrayList<>();
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RateAnalysisDto fromEntity(RateAnalysis e) {
        RateAnalysisDto d = new RateAnalysisDto();
        d.id = e.getId();
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        if (e.getActivity() != null) {
            d.activityId = e.getActivity().getId();
            d.activityName = e.getActivity().getName();
        }
        d.rateType = e.getRateType();
        d.unitRate = e.getUnitRate();
        d.status = e.getStatus();
        d.remarks = e.getRemarks();
        if (e.getItems() != null) {
            d.items = e.getItems().stream()
                    .map(RateAnalysisItemDto::fromEntity)
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
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public Long getActivityId() { return activityId; }
    public void setActivityId(Long activityId) { this.activityId = activityId; }
    public String getActivityName() { return activityName; }
    public void setActivityName(String activityName) { this.activityName = activityName; }
    public String getRateType() { return rateType; }
    public void setRateType(String rateType) { this.rateType = rateType; }
    public BigDecimal getUnitRate() { return unitRate; }
    public void setUnitRate(BigDecimal unitRate) { this.unitRate = unitRate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<RateAnalysisItemDto> getItems() { return items; }
    public void setItems(List<RateAnalysisItemDto> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
