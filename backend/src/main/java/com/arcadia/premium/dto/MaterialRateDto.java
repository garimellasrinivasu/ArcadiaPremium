package com.arcadia.premium.dto;

import com.arcadia.premium.model.MaterialRate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class MaterialRateDto {
    private Long id;
    private Long vendorId;
    private String vendorName;
    private Long materialId;
    private String materialName;
    private BigDecimal rate;
    private LocalDate rateDate;
    private boolean approved;
    private String approvedBy;
    private LocalDate approvedDate;
    private Double taxPercent;
    private String taxType;
    private String remarks;
    private String status;
    private String submittedBy;
    private String rejectionReason;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MaterialRateDto fromEntity(MaterialRate e) {
        MaterialRateDto d = new MaterialRateDto();
        d.id = e.getId();
        if (e.getVendor() != null) {
            d.vendorId = e.getVendor().getId();
            d.vendorName = e.getVendor().getName();
        }
        if (e.getMaterial() != null) {
            d.materialId = e.getMaterial().getId();
            d.materialName = e.getMaterial().getName();
        }
        d.rate = e.getRate();
        d.rateDate = e.getRateDate();
        d.approved = e.isApproved();
        d.approvedBy = e.getApprovedBy();
        d.approvedDate = e.getApprovedDate();
        d.taxPercent = e.getTaxPercent();
        d.taxType = e.getTaxType();
        d.remarks = e.getRemarks();
        d.status = e.getStatus();
        d.submittedBy = e.getSubmittedBy();
        d.rejectionReason = e.getRejectionReason();
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }
    public String getMaterialName() { return materialName; }
    public void setMaterialName(String materialName) { this.materialName = materialName; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public LocalDate getRateDate() { return rateDate; }
    public void setRateDate(LocalDate rateDate) { this.rateDate = rateDate; }
    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public LocalDate getApprovedDate() { return approvedDate; }
    public void setApprovedDate(LocalDate approvedDate) { this.approvedDate = approvedDate; }
    public Double getTaxPercent() { return taxPercent; }
    public void setTaxPercent(Double taxPercent) { this.taxPercent = taxPercent; }
    public String getTaxType() { return taxType; }
    public void setTaxType(String taxType) { this.taxType = taxType; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
