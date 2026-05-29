package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "material_boq")
public class MaterialBOQ {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** Sub-project or unit name */
    private String unitName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private MaterialMaster material;

    @Column(precision = 15, scale = 4)
    private BigDecimal boqQuantity = BigDecimal.ZERO;

    private Double wastagePercent = 0.0;

    /** boqQuantity * (1 + wastagePercent / 100) */
    @Column(precision = 15, scale = 4)
    private BigDecimal effectiveQuantity;

    /** DRAFT, PENDING_APPROVAL, APPROVED */
    @Column(nullable = false)
    private String status = "DRAFT";

    private String approvedBy;

    private String remarks;

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public MaterialBOQ() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public String getUnitName() { return unitName; }
    public void setUnitName(String unitName) { this.unitName = unitName; }
    public MaterialMaster getMaterial() { return material; }
    public void setMaterial(MaterialMaster material) { this.material = material; }
    public BigDecimal getBoqQuantity() { return boqQuantity; }
    public void setBoqQuantity(BigDecimal boqQuantity) { this.boqQuantity = boqQuantity; }
    public Double getWastagePercent() { return wastagePercent; }
    public void setWastagePercent(Double wastagePercent) { this.wastagePercent = wastagePercent; }
    public BigDecimal getEffectiveQuantity() { return effectiveQuantity; }
    public void setEffectiveQuantity(BigDecimal effectiveQuantity) { this.effectiveQuantity = effectiveQuantity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
