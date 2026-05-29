package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rate_analyses")
public class RateAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private ActivityMaster activity;

    /** SUBCONTRACTING or RATE_ANALYSIS */
    @Column(nullable = false)
    private String rateType;

    /** Computed sum of all items (coefficient * rate) */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal unitRate = BigDecimal.ZERO;

    /** DRAFT, APPROVED, REJECTED */
    @Column(nullable = false)
    private String status = "DRAFT";

    @Column(length = 1000)
    private String remarks;

    @OneToMany(mappedBy = "rateAnalysis", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RateAnalysisItem> items = new ArrayList<>();

    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public RateAnalysis() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public ActivityMaster getActivity() { return activity; }
    public void setActivity(ActivityMaster activity) { this.activity = activity; }
    public String getRateType() { return rateType; }
    public void setRateType(String rateType) { this.rateType = rateType; }
    public BigDecimal getUnitRate() { return unitRate; }
    public void setUnitRate(BigDecimal unitRate) { this.unitRate = unitRate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<RateAnalysisItem> getItems() { return items; }
    public void setItems(List<RateAnalysisItem> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
