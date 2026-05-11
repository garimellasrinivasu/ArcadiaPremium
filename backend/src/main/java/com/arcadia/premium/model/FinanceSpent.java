package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "finance_spent")
public class FinanceSpent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String projectName;

    @Column(nullable = false)
    private LocalDate spentDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String paidBy;

    @Column(nullable = false)
    private String paidTo;

    private String vendorAcknowledgement; // YES, NO, PENDING

    @Column(columnDefinition = "TEXT")
    private String receiptImageBase64;

    private String description;

    private String remarks;

    /** Status: PENDING, IN_APPROVAL, APPROVED, REJECTED */
    @Column(nullable = false)
    private String status = "PENDING";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    private String approverRemarks;

    private LocalDateTime approvedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public FinanceSpent() {}

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
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }
    public User getApprovedBy() { return approvedBy; }
    public void setApprovedBy(User approvedBy) { this.approvedBy = approvedBy; }
    public String getApproverRemarks() { return approverRemarks; }
    public void setApproverRemarks(String approverRemarks) { this.approverRemarks = approverRemarks; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
