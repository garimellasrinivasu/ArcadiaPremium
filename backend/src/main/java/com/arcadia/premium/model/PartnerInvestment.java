package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "partner_investment")
public class PartnerInvestment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String projectName;

    @Column(nullable = false)
    private String partnerName;

    @Column(nullable = false)
    private LocalDate investmentDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    /** CASH, BANK_TRANSFER, CHEQUE, UPI, OTHER */
    @Column(nullable = false)
    private String paymentMode;

    private String referenceNo;

    private String bankName;

    private String accountDetails;

    private String transactionId;

    @Column(length = 1000)
    private String description;

    /** LAND, CONSTRUCTION, MATERIAL, LABOUR, LEGAL, REGISTRATION, OTHER */
    private String purpose;

    @Column(columnDefinition = "TEXT")
    private String receiptImageBase64;

    /** DRAFT, PENDING, APPROVED */
    @Column(nullable = false)
    private String status = "DRAFT";

    /* ── Partner Approval Tracking ── */

    private Boolean partner1Approved;
    private LocalDateTime partner1ApprovedAt;
    @Column(columnDefinition = "TEXT")
    private String partner1Signature;

    private Boolean partner2Approved;
    private LocalDateTime partner2ApprovedAt;
    @Column(columnDefinition = "TEXT")
    private String partner2Signature;

    private Boolean partner3Approved;
    private LocalDateTime partner3ApprovedAt;
    @Column(columnDefinition = "TEXT")
    private String partner3Signature;

    /* ── Metadata ── */

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(length = 500)
    private String remarks;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public PartnerInvestment() {}

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
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
