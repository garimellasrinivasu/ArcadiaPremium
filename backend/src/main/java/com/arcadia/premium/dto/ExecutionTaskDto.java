package com.arcadia.premium.dto;

import com.arcadia.premium.model.ExecutionTask;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ExecutionTaskDto {

    private Long id;
    private String taskCode;
    private Long projectId;
    private String projectName;
    private String unitOrBlock;
    private String taskName;
    private String description;
    private String assignedTo;
    private String status;
    private Integer completionPercentage;
    private LocalDate startDate;
    private LocalDate targetDate;
    private LocalDate completedDate;
    private String remarks;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ExecutionTaskDto fromEntity(ExecutionTask e) {
        ExecutionTaskDto d = new ExecutionTaskDto();
        d.id = e.getId();
        d.taskCode = e.getTaskCode();
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        d.unitOrBlock = e.getUnitOrBlock();
        d.taskName = e.getTaskName();
        d.description = e.getDescription();
        d.assignedTo = e.getAssignedTo();
        d.status = e.getStatus();
        d.completionPercentage = e.getCompletionPercentage();
        d.startDate = e.getStartDate();
        d.targetDate = e.getTargetDate();
        d.completedDate = e.getCompletedDate();
        d.remarks = e.getRemarks();
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String taskCode) { this.taskCode = taskCode; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getUnitOrBlock() { return unitOrBlock; }
    public void setUnitOrBlock(String unitOrBlock) { this.unitOrBlock = unitOrBlock; }
    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getCompletionPercentage() { return completionPercentage; }
    public void setCompletionPercentage(Integer completionPercentage) { this.completionPercentage = completionPercentage; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public LocalDate getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
