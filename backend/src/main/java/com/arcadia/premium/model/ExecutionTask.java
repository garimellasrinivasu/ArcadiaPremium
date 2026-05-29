package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "execution_tasks")
public class ExecutionTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Auto-generated: TASK-001, TASK-002, etc. */
    @Column(nullable = false, unique = true)
    private String taskCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    /** e.g. "Block A", "Tower 1 - Unit 201" */
    private String unitOrBlock;

    @Column(nullable = false)
    private String taskName;

    @Column(length = 1000)
    private String description;

    /** Username of assigned JE/supervisor */
    private String assignedTo;

    /** PENDING, IN_PROGRESS, COMPLETED, ON_HOLD */
    @Column(nullable = false)
    private String status = "PENDING";

    /** 0-100 */
    @Column(nullable = false)
    private Integer completionPercentage = 0;

    private LocalDate startDate;

    private LocalDate targetDate;

    /** Set automatically when completionPercentage reaches 100 */
    private LocalDate completedDate;

    @Column(length = 1000)
    private String remarks;

    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public ExecutionTask() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String taskCode) { this.taskCode = taskCode; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
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
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
