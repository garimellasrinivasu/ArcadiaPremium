package com.arcadia.premium.dto;

import com.arcadia.premium.model.FinanceSpent;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class FinanceSpentDto {
    private Long id;
    private String projectName;
    private LocalDate spentDate;
    private BigDecimal amount;
    private String paidBy;
    private String paidTo;
    private String vendorAcknowledgement;
    private String receiptImageBase64;
    private boolean hasReceipt;
    private String description;
    private String remarks;
    private String status;
    private Long submittedById;
    private String submittedByName;
    private Long approvedById;
    private String approvedByName;
    private String approverRemarks;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FinanceSpentDto fromEntity(FinanceSpent e) {
        return fromEntity(e, true);
    }

    public static FinanceSpentDto fromEntity(FinanceSpent e, boolean includeImage) {
        FinanceSpentDto d = new FinanceSpentDto();
        d.id = e.getId();
        d.projectName = e.getProjectName();
        d.spentDate = e.getSpentDate();
        d.amount = e.getAmount();
        d.paidBy = e.getPaidBy();
        d.paidTo = e.getPaidTo();
        d.vendorAcknowledgement = e.getVendorAcknowledgement();
        d.hasReceipt = e.getReceiptImageBase64() != null && !e.getReceiptImageBase64().isEmpty();
        if (includeImage) {
            d.receiptImageBase64 = e.getReceiptImageBase64();
        }
        d.description = e.getDescription();
        d.remarks = e.getRemarks();
        d.status = e.getStatus();
        if (e.getSubmittedBy() != null) {
            d.submittedById = e.getSubmittedBy().getId();
            d.submittedByName = e.getSubmittedBy().getFirstName() + " " + e.getSubmittedBy().getLastName();
        }
        if (e.getApprovedBy() != null) {
            d.approvedById = e.getApprovedBy().getId();
            d.approvedByName = e.getApprovedBy().getFirstName() + " " + e.getApprovedBy().getLastName();
        }
        d.approverRemarks = e.getApproverRemarks();
        d.approvedAt = e.getApprovedAt();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public LocalDate getSpentDate() { return spentDate; }
    public void setSpentDate(LocalDate spentDate) { this.spentDate = spentDate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getPaidBy() { return paidBy; }
    public void setPaidBy(String paidBy) { this.paidBy = paidBy; }
    public String getPaidTo() { return paidTo; }
    public void setPaidTo(String paidTo) { this.paidTo = paidTo; }
    public String getVendorAcknowledgement() { return vendorAcknowledgement; }
    public void setVendorAcknowledgement(String vendorAcknowledgement) { this.vendorAcknowledgement = vendorAcknowledgement; }
    public String getReceiptImageBase64() { return receiptImageBase64; }
    public void setReceiptImageBase64(String receiptImageBase64) { this.receiptImageBase64 = receiptImageBase64; }
    public boolean isHasReceipt() { return hasReceipt; }
    public void setHasReceipt(boolean hasReceipt) { this.hasReceipt = hasReceipt; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getSubmittedById() { return submittedById; }
    public void setSubmittedById(Long submittedById) { this.submittedById = submittedById; }
    public String getSubmittedByName() { return submittedByName; }
    public void setSubmittedByName(String submittedByName) { this.submittedByName = submittedByName; }
    public Long getApprovedById() { return approvedById; }
    public void setApprovedById(Long approvedById) { this.approvedById = approvedById; }
    public String getApprovedByName() { return approvedByName; }
    public void setApprovedByName(String approvedByName) { this.approvedByName = approvedByName; }
    public String getApproverRemarks() { return approverRemarks; }
    public void setApproverRemarks(String approverRemarks) { this.approverRemarks = approverRemarks; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
