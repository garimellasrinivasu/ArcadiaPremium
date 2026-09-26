package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "todo_tasks")
public class TodoTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Auto-generated: TODO-001, TODO-002, etc. */
    @Column(nullable = false, unique = true)
    private String taskCode;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    /** CONSTRUCTION, LEGAL, FINANCE, ADMIN */
    @Column(nullable = false)
    private String category = "ADMIN";

    /** HIGH, MEDIUM, LOW */
    @Column(nullable = false)
    private String priority = "MEDIUM";

    /** PENDING, IN_PROGRESS, COMPLETED, OVERDUE */
    @Column(nullable = false)
    private String status = "PENDING";

    @Column(nullable = false)
    private LocalDate targetDate;

    private LocalDate actualCompletionDate;

    /** Project name (optional — task may not be project-specific) */
    private String project;

    /** Email of the user this task is assigned to */
    @Column(nullable = false)
    private String assignedTo;

    /** Display name of the assigned user (denormalized for quick display) */
    private String assignedToName;

    /** Email of the user who created/assigned this task */
    @Column(nullable = false)
    private String assignedBy;

    /** Display name of the assigner (denormalized for quick display) */
    private String assignedByName;

    @Column(length = 2000)
    private String remarks;

    /** Daily update note — updated each day */
    @Column(length = 2000)
    private String dailyUpdate;

    /** When the daily update was last modified */
    private LocalDateTime dailyUpdateAt;

    /** Whether daily email+WhatsApp reminders are enabled */
    @Column(nullable = false)
    private Boolean reminderEnabled = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public TodoTask() {}

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
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
