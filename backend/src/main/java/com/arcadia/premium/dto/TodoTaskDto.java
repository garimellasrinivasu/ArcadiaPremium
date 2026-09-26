package com.arcadia.premium.dto;

import com.arcadia.premium.model.TodoTask;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class TodoTaskDto {

    private Long id;
    private String taskCode;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private LocalDate targetDate;
    private LocalDate actualCompletionDate;
    private String project;
    private String assignedTo;
    private String assignedToName;
    private String assignedBy;
    private String assignedByName;
    private String remarks;
    private String dailyUpdate;
    private LocalDateTime dailyUpdateAt;
    private Boolean reminderEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** Computed: days remaining (positive) or overdue (negative) */
    private Long daysRemaining;

    public static TodoTaskDto fromEntity(TodoTask e) {
        TodoTaskDto d = new TodoTaskDto();
        d.id = e.getId();
        d.taskCode = e.getTaskCode();
        d.title = e.getTitle();
        d.description = e.getDescription();
        d.category = e.getCategory();
        d.priority = e.getPriority();
        d.status = e.getStatus();
        d.targetDate = e.getTargetDate();
        d.actualCompletionDate = e.getActualCompletionDate();
        d.project = e.getProject();
        d.assignedTo = e.getAssignedTo();
        d.assignedToName = e.getAssignedToName();
        d.assignedBy = e.getAssignedBy();
        d.assignedByName = e.getAssignedByName();
        d.remarks = e.getRemarks();
        d.dailyUpdate = e.getDailyUpdate();
        d.dailyUpdateAt = e.getDailyUpdateAt();
        d.reminderEnabled = e.getReminderEnabled();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        // Compute days remaining
        if (e.getTargetDate() != null && !"COMPLETED".equals(e.getStatus())) {
            d.daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), e.getTargetDate());
        }
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String taskCode) { this.taskCode = taskCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public LocalDate getActualCompletionDate() { return actualCompletionDate; }
    public void setActualCompletionDate(LocalDate actualCompletionDate) { this.actualCompletionDate = actualCompletionDate; }
    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }
    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }
    public String getAssignedByName() { return assignedByName; }
    public void setAssignedByName(String assignedByName) { this.assignedByName = assignedByName; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getDailyUpdate() { return dailyUpdate; }
    public void setDailyUpdate(String dailyUpdate) { this.dailyUpdate = dailyUpdate; }
    public LocalDateTime getDailyUpdateAt() { return dailyUpdateAt; }
    public void setDailyUpdateAt(LocalDateTime dailyUpdateAt) { this.dailyUpdateAt = dailyUpdateAt; }
    public Boolean getReminderEnabled() { return reminderEnabled; }
    public void setReminderEnabled(Boolean reminderEnabled) { this.reminderEnabled = reminderEnabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Long getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(Long daysRemaining) { this.daysRemaining = daysRemaining; }
}
