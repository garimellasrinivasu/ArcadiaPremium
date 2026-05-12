package com.arcadia.premium.dto;

import java.math.BigDecimal;

public class CreatePartnerInvestmentRequest {
    private String projectName;
    private String partnerName;
    private String investmentDate; // yyyy-MM-dd
    private BigDecimal amount;
    private String paymentMode;
    private String referenceNo;
    private String bankName;
    private String accountDetails;
    private String transactionId;
    private String description;
    private String purpose;
    private String receiptImageBase64;
    private String remarks;

    // Getters and Setters
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }
    public String getInvestmentDate() { return investmentDate; }
    public void setInvestmentDate(String investmentDate) { this.investmentDate = investmentDate; }
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
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
