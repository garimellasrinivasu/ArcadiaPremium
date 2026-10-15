package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** One activity on a document checklist page (Sales Preparation Data or RERA Documentation) for a project. */
@Entity
@Table(name = "checklist_items", indexes = @Index(columnList = "tracker_type, project_name"))
public class ChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** SALES_PREP or RERA_DOCS */
    @Column(name = "tracker_type", nullable = false, length = 20)
    private String trackerType;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(nullable = false)
    private String section;

    private int sortOrder;

    @Column(nullable = false, length = 500)
    private String title;

    /** What is needed / notes from the checklist */
    @Column(length = 2000)
    private String details;

    /** NOT_STARTED, IN_PROGRESS, COMPLETED, NOT_APPLICABLE */
    @Column(nullable = false, length = 20)
    private String status = "NOT_STARTED";

    /** SPG owner (column kept as "owner") */
    private String owner;
    private String technicalOwner;
    private LocalDate targetDate;
    private LocalDate completedDate;

    @Column(length = 2000)
    private String remarks;

    private String updatedBy;
    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public String getTrackerType() { return trackerType; }
    public void setTrackerType(String trackerType) { this.trackerType = trackerType; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public String getTechnicalOwner() { return technicalOwner; }
    public void setTechnicalOwner(String technicalOwner) { this.technicalOwner = technicalOwner; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public LocalDate getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
