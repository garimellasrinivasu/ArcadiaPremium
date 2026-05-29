package com.arcadia.premium.dto;

import com.arcadia.premium.model.DailyExecutionUpdate;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DailyExecutionUpdateDto {

    private Long id;
    private Long executionTaskId;
    private String taskCode;
    private String taskName;
    private LocalDate updateDate;
    private Integer previousPercentage;
    private Integer newPercentage;
    private String remarks;
    private String updatedBy;
    private LocalDateTime createdAt;

    public static DailyExecutionUpdateDto fromEntity(DailyExecutionUpdate e) {
        DailyExecutionUpdateDto d = new DailyExecutionUpdateDto();
        d.id = e.getId();
        if (e.getExecutionTask() != null) {
            d.executionTaskId = e.getExecutionTask().getId();
            d.taskCode = e.getExecutionTask().getTaskCode();
            d.taskName = e.getExecutionTask().getTaskName();
        }
        d.updateDate = e.getUpdateDate();
        d.previousPercentage = e.getPreviousPercentage();
        d.newPercentage = e.getNewPercentage();
        d.remarks = e.getRemarks();
        d.updatedBy = e.getUpdatedBy();
        d.createdAt = e.getCreatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getExecutionTaskId() { return executionTaskId; }
    public void setExecutionTaskId(Long executionTaskId) { this.executionTaskId = executionTaskId; }
    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String taskCode) { this.taskCode = taskCode; }
    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }
    public LocalDate getUpdateDate() { return updateDate; }
    public void setUpdateDate(LocalDate updateDate) { this.updateDate = updateDate; }
    public Integer getPreviousPercentage() { return previousPercentage; }
    public void setPreviousPercentage(Integer previousPercentage) { this.previousPercentage = previousPercentage; }
    public Integer getNewPercentage() { return newPercentage; }
    public void setNewPercentage(Integer newPercentage) { this.newPercentage = newPercentage; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
