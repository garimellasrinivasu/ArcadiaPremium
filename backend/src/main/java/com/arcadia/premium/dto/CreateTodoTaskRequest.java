package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreateTodoTaskRequest {

    @NotBlank
    private String title;

    private String description;

    /** CONSTRUCTION, LEGAL, FINANCE, ADMIN */
    @NotBlank
    private String category;

    /** HIGH, MEDIUM, LOW */
    @NotBlank
    private String priority;

    @NotNull
    private LocalDate targetDate;

    /** Optional project name */
    private String project;

    /** Email of the user to assign to */
    @NotBlank
    private String assignedTo;

    private String remarks;

    private Boolean reminderEnabled;

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Boolean getReminderEnabled() { return reminderEnabled; }
    public void setReminderEnabled(Boolean reminderEnabled) { this.reminderEnabled = reminderEnabled; }
}
