package com.arcadia.premium.dto;

import com.arcadia.premium.model.MaterialBOQ;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MaterialBOQDto {
    private Long id;
    private Long projectId;
    private String projectName;
    private String unitName;
    private Long materialId;
    private String materialName;
    private String materialUom;
    private BigDecimal boqQuantity;
    private Double wastagePercent;
    private BigDecimal effectiveQuantity;
    private String status;
    private String approvedBy;
    private String remarks;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MaterialBOQDto fromEntity(MaterialBOQ e) {
        MaterialBOQDto d = new MaterialBOQDto();
        d.id = e.getId();
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        d.unitName = e.getUnitName();
        if (e.getMaterial() != null) {
            d.materialId = e.getMaterial().getId();
            d.materialName = e.getMaterial().getName();
            d.materialUom = e.getMaterial().getUom();
        }
        d.boqQuantity = e.getBoqQuantity();
        d.wastagePercent = e.getWastagePercent();
        d.effectiveQuantity = e.getEffectiveQuantity();
        d.status = e.getStatus();
        d.approvedBy = e.getApprovedBy();
        d.remarks = e.getRemarks();
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getUnitName() { return unitName; }
    public void setUnitName(String unitName) { this.unitName = unitName; }
    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }
    public String getMaterialName() { return materialName; }
    public void setMaterialName(String materialName) { this.materialName = materialName; }
    public String getMaterialUom() { return materialUom; }
    public void setMaterialUom(String materialUom) { this.materialUom = materialUom; }
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
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
