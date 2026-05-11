package com.arcadia.premium.dto;

import java.math.BigDecimal;

public class CreateFinanceSpentRequest {
    private String projectName;
    private String spentDate; // yyyy-MM-dd
    private BigDecimal amount;
    private String paidBy;
    private String paidTo;
    private String vendorAcknowledgement;
    private String receiptImageBase64;
    private String description;
    private String remarks;

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getSpentDate() { return spentDate; }
    public void setSpentDate(String spentDate) { this.spentDate = spentDate; }
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
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
