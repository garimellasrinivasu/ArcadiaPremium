package com.arcadia.premium.dto;

import com.arcadia.premium.model.RABill;
import com.arcadia.premium.model.RABillAdjustment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class RABillDto {
    private Long id;
    private String billNo;
    private Long workOrderId;
    private String woNumber;
    private Long contractorId;
    private String contractorName;
    private Long projectId;
    private String projectName;
    private LocalDate billDate;
    private String billType;
    private String advanceCategory;
    private Double advancePercent;
    private BigDecimal advanceAmount;
    private BigDecimal currentBillAmount;
    private BigDecimal previousBillAmount;
    private BigDecimal cumulativeBillAmount;
    private Double retentionPercent;
    private BigDecimal retentionAmount;
    private BigDecimal advanceRecoveryAmount;
    private BigDecimal deductionAmount;
    private BigDecimal retentionReleaseAmount;
    private BigDecimal deductionReleaseAmount;
    private BigDecimal taxAmount;
    private BigDecimal netPayable;
    private String status;
    private boolean posted;
    private String remarks;
    private List<RABillItemDto> items;
    private List<RABillAdjustmentDto> adjustments;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RABillDto fromEntity(RABill e) {
        return fromEntity(e, null);
    }

    public static RABillDto fromEntity(RABill e, List<RABillAdjustment> adjList) {
        RABillDto d = new RABillDto();
        d.id = e.getId();
        d.billNo = e.getBillNo();
        if (e.getWorkOrder() != null) {
            d.workOrderId = e.getWorkOrder().getId();
            d.woNumber = e.getWorkOrder().getWoNumber();
        }
        if (e.getContractor() != null) {
            d.contractorId = e.getContractor().getId();
            d.contractorName = e.getContractor().getName();
        }
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        d.billDate = e.getBillDate();
        d.billType = e.getBillType();
        d.advanceCategory = e.getAdvanceCategory();
        d.advancePercent = e.getAdvancePercent();
        d.advanceAmount = e.getAdvanceAmount();
        d.currentBillAmount = e.getCurrentBillAmount();
        d.previousBillAmount = e.getPreviousBillAmount();
        d.cumulativeBillAmount = e.getCumulativeBillAmount();
        d.retentionPercent = e.getRetentionPercent();
        d.retentionAmount = e.getRetentionAmount();
        d.advanceRecoveryAmount = e.getAdvanceRecoveryAmount();
        d.deductionAmount = e.getDeductionAmount();
        d.retentionReleaseAmount = e.getRetentionReleaseAmount();
        d.deductionReleaseAmount = e.getDeductionReleaseAmount();
        d.taxAmount = e.getTaxAmount();
        d.netPayable = e.getNetPayable();
        d.status = e.getStatus();
        d.posted = e.isPosted();
        d.remarks = e.getRemarks();
        if (e.getItems() != null) {
            d.items = e.getItems().stream().map(RABillItemDto::fromEntity).collect(Collectors.toList());
        }
        if (adjList != null) {
            d.adjustments = adjList.stream().map(RABillAdjustmentDto::fromEntity).collect(Collectors.toList());
        }
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBillNo() { return billNo; }
    public void setBillNo(String billNo) { this.billNo = billNo; }
    public Long getWorkOrderId() { return workOrderId; }
    public void setWorkOrderId(Long workOrderId) { this.workOrderId = workOrderId; }
    public String getWoNumber() { return woNumber; }
    public void setWoNumber(String woNumber) { this.woNumber = woNumber; }
    public Long getContractorId() { return contractorId; }
    public void setContractorId(Long contractorId) { this.contractorId = contractorId; }
    public String getContractorName() { return contractorName; }
    public void setContractorName(String contractorName) { this.contractorName = contractorName; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public LocalDate getBillDate() { return billDate; }
    public void setBillDate(LocalDate billDate) { this.billDate = billDate; }
    public String getBillType() { return billType; }
    public void setBillType(String billType) { this.billType = billType; }
    public String getAdvanceCategory() { return advanceCategory; }
    public void setAdvanceCategory(String advanceCategory) { this.advanceCategory = advanceCategory; }
    public Double getAdvancePercent() { return advancePercent; }
    public void setAdvancePercent(Double advancePercent) { this.advancePercent = advancePercent; }
    public BigDecimal getAdvanceAmount() { return advanceAmount; }
    public void setAdvanceAmount(BigDecimal advanceAmount) { this.advanceAmount = advanceAmount; }
    public BigDecimal getCurrentBillAmount() { return currentBillAmount; }
    public void setCurrentBillAmount(BigDecimal currentBillAmount) { this.currentBillAmount = currentBillAmount; }
    public BigDecimal getPreviousBillAmount() { return previousBillAmount; }
    public void setPreviousBillAmount(BigDecimal previousBillAmount) { this.previousBillAmount = previousBillAmount; }
    public BigDecimal getCumulativeBillAmount() { return cumulativeBillAmount; }
    public void setCumulativeBillAmount(BigDecimal cumulativeBillAmount) { this.cumulativeBillAmount = cumulativeBillAmount; }
    public Double getRetentionPercent() { return retentionPercent; }
    public void setRetentionPercent(Double retentionPercent) { this.retentionPercent = retentionPercent; }
    public BigDecimal getRetentionAmount() { return retentionAmount; }
    public void setRetentionAmount(BigDecimal retentionAmount) { this.retentionAmount = retentionAmount; }
    public BigDecimal getAdvanceRecoveryAmount() { return advanceRecoveryAmount; }
    public void setAdvanceRecoveryAmount(BigDecimal advanceRecoveryAmount) { this.advanceRecoveryAmount = advanceRecoveryAmount; }
    public BigDecimal getDeductionAmount() { return deductionAmount; }
    public void setDeductionAmount(BigDecimal deductionAmount) { this.deductionAmount = deductionAmount; }
    public BigDecimal getRetentionReleaseAmount() { return retentionReleaseAmount; }
    public void setRetentionReleaseAmount(BigDecimal retentionReleaseAmount) { this.retentionReleaseAmount = retentionReleaseAmount; }
    public BigDecimal getDeductionReleaseAmount() { return deductionReleaseAmount; }
    public void setDeductionReleaseAmount(BigDecimal deductionReleaseAmount) { this.deductionReleaseAmount = deductionReleaseAmount; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getNetPayable() { return netPayable; }
    public void setNetPayable(BigDecimal netPayable) { this.netPayable = netPayable; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isPosted() { return posted; }
    public void setPosted(boolean posted) { this.posted = posted; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<RABillItemDto> getItems() { return items; }
    public void setItems(List<RABillItemDto> items) { this.items = items; }
    public List<RABillAdjustmentDto> getAdjustments() { return adjustments; }
    public void setAdjustments(List<RABillAdjustmentDto> adjustments) { this.adjustments = adjustments; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
