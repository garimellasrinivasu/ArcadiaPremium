package com.arcadia.premium.dto;

import com.arcadia.premium.model.PartnerInvestment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PartnerInvestmentDto {
    private Long id;
    private String projectName;
    private String partnerName;
    private LocalDate investmentDate;
    private BigDecimal amount;
    private String paymentMode;
    private String referenceNo;
    private String bankName;
    private String accountDetails;
    private String transactionId;
    private String description;
    private String purpose;
    private String receiptImageBase64;
    private boolean hasReceipt;
    private String status;

    private Boolean partner1Approved;
    private LocalDateTime partner1ApprovedAt;
    private String partner1Signature;
    private Boolean partner2Approved;
    private LocalDateTime partner2ApprovedAt;
    private String partner2Signature;
    private Boolean partner3Approved;
    private LocalDateTime partner3ApprovedAt;
    private String partner3Signature;

    private Long createdById;
    private String createdByName;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PartnerInvestmentDto fromEntity(PartnerInvestment e) {
        return fromEntity(e, false, false);
    }

    public static PartnerInvestmentDto fromEntity(PartnerInvestment e, boolean includeImage, boolean includeSignatures) {
        PartnerInvestmentDto d = new PartnerInvestmentDto();
        d.id = e.getId();
        d.projectName = e.getProjectName();
        d.partnerName = e.getPartnerName();
        d.investmentDate = e.getInvestmentDate();
        d.amount = e.getAmount();
        d.paymentMode = e.getPaymentMode();
        d.referenceNo = e.getReferenceNo();
        d.bankName = e.getBankName();
        d.accountDetails = e.getAccountDetails();
        d.transactionId = e.getTransactionId();
        d.description = e.getDescription();
        d.purpose = e.getPurpose();
        d.hasReceipt = e.getReceiptImageBase64() != null && !e.getReceiptImageBase64().isEmpty();
        if (includeImage) {
            d.receiptImageBase64 = e.getReceiptImageBase64();
        }
        d.status = e.getStatus();

        d.partner1Approved = e.getPartner1Approved();
        d.partner1ApprovedAt = e.getPartner1ApprovedAt();
        d.partner2Approved = e.getPartner2Approved();
        d.partner2ApprovedAt = e.getPartner2ApprovedAt();
        d.partner3Approved = e.getPartner3Approved();
        d.partner3ApprovedAt = e.getPartner3ApprovedAt();

        if (includeSignatures) {
            d.partner1Signature = e.getPartner1Signature();
            d.partner2Signature = e.getPartner2Signature();
            d.partner3Signature = e.getPartner3Signature();
        }

        if (e.getCreatedBy() != null) {
            d.createdById = e.getCreatedBy().getId();
            d.createdByName = e.getCreatedBy().getFirstName() + " " + e.getCreatedBy().getLastName();
        }
        d.remarks = e.getRemarks();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }
    public LocalDate getInvestmentDate() { return investmentDate; }
    public void setInvestmentDate(LocalDate investmentDate) { this.investmentDate = investmentDate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public String getReferenceNo() { return referenceNo; }
    public void setReferenceNo(String referenceNo) { this.referenceNo = referenceNo; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getAccountDetails() { return accountDetails; }
    public void setAccountDetails(String accountDetails) { this.accountDetails = accountDetails; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getReceiptImageBase64() { return receiptImageBase64; }
    public void setReceiptImageBase64(String receiptImageBase64) { this.receiptImageBase64 = receiptImageBase64; }
    public boolean isHasReceipt() { return hasReceipt; }
    public void setHasReceipt(boolean hasReceipt) { this.hasReceipt = hasReceipt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getPartner1Approved() { return partner1Approved; }
    public void setPartner1Approved(Boolean partner1Approved) { this.partner1Approved = partner1Approved; }
    public LocalDateTime getPartner1ApprovedAt() { return partner1ApprovedAt; }
    public void setPartner1ApprovedAt(LocalDateTime partner1ApprovedAt) { this.partner1ApprovedAt = partner1ApprovedAt; }
    public String getPartner1Signature() { return partner1Signature; }
    public void setPartner1Signature(String partner1Signature) { this.partner1Signature = partner1Signature; }
    public Boolean getPartner2Approved() { return partner2Approved; }
    public void setPartner2Approved(Boolean partner2Approved) { this.partner2Approved = partner2Approved; }
    public LocalDateTime getPartner2ApprovedAt() { return partner2ApprovedAt; }
    public void setPartner2ApprovedAt(LocalDateTime partner2ApprovedAt) { this.partner2ApprovedAt = partner2ApprovedAt; }
    public String getPartner2Signature() { return partner2Signature; }
    public void setPartner2Signature(String partner2Signature) { this.partner2Signature = partner2Signature; }
    public Boolean getPartner3Approved() { return partner3Approved; }
    public void setPartner3Approved(Boolean partner3Approved) { this.partner3Approved = partner3Approved; }
    public LocalDateTime getPartner3ApprovedAt() { return partner3ApprovedAt; }
    public void setPartner3ApprovedAt(LocalDateTime partner3ApprovedAt) { this.partner3ApprovedAt = partner3ApprovedAt; }
    public String getPartner3Signature() { return partner3Signature; }
    public void setPartner3Signature(String partner3Signature) { this.partner3Signature = partner3Signature; }
    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
