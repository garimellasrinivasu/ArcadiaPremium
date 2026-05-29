package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "measurement_books")
public class MeasurementBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Auto-generated: MB-001, MB-002, etc. */
    @Column(nullable = false, unique = true)
    private String mbNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private LocalDate mbDate;

    /** DRAFT, PENDING_APPROVAL, APPROVED */
    @Column(nullable = false)
    private String status = "DRAFT";

    @Column(length = 2000)
    private String remarks;

    @OneToMany(mappedBy = "measurementBook", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MeasurementBookItem> items = new ArrayList<>();

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public MeasurementBook() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMbNumber() { return mbNumber; }
    public void setMbNumber(String mbNumber) { this.mbNumber = mbNumber; }
    public WorkOrder getWorkOrder() { return workOrder; }
    public void setWorkOrder(WorkOrder workOrder) { this.workOrder = workOrder; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public LocalDate getMbDate() { return mbDate; }
    public void setMbDate(LocalDate mbDate) { this.mbDate = mbDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<MeasurementBookItem> getItems() { return items; }
    public void setItems(List<MeasurementBookItem> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
