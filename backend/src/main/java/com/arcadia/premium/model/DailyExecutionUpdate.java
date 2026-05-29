package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_execution_updates")
public class DailyExecutionUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_task_id", nullable = false)
    private ExecutionTask executionTask;

    @Column(nullable = false)
    private LocalDate updateDate;

    private Integer previousPercentage;

    private Integer newPercentage;

    @Column(length = 1000)
    private String remarks;

    private String updatedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public DailyExecutionUpdate() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ExecutionTask getExecutionTask() { return executionTask; }
    public void setExecutionTask(ExecutionTask executionTask) { this.executionTask = executionTask; }
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
}
