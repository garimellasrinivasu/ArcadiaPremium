package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ra_bills")
public class RABill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Auto-generated: RAB-001, RAB-002, etc. */
    @Column(nullable = false, unique = true)
    private String billNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contractor_id", nullable = false)
    private Contractor contractor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private LocalDate billDate;

    /** ADVANCE, WORK_DONE, RECOVERY_RELEASE, FINAL */
    @Column(nullable = false)
    private String billType;

    /** MOBILIZATION, ADHOC - used when billType = ADVANCE */
    private String advanceCategory;

    private Double advancePercent;

    @Column(precision = 15, scale = 2)
    private BigDecimal advanceAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal currentBillAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal previousBillAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal cumulativeBillAmount = BigDecimal.ZERO;

    private Double retentionPercent;

    @Column(precision = 15, scale = 2)
    private BigDecimal retentionAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal advanceRecoveryAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal deductionAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal retentionReleaseAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal deductionReleaseAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal netPayable = BigDecimal.ZERO;

    /** DRAFT, PENDING_APPROVAL, APPROVED, POSTED */
    @Column(nullable = false)
    private String status = "DRAFT";

    private boolean posted = false;

    @Column(length = 2000)
    private String remarks;

    @OneToMany(mappedBy = "raBill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RABillItem> items = new ArrayList<>();

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public RABill() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBillNo() { return billNo; }
    public void setBillNo(String billNo) { this.billNo = billNo; }
    public WorkOrder getWorkOrder() { return workOrder; }
    public void setWorkOrder(WorkOrder workOrder) { this.workOrder = workOrder; }
    public Contractor getContractor() { return contractor; }
    public void setContractor(Contractor contractor) { this.contractor = contractor; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
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
    public List<RABillItem> getItems() { return items; }
    public void setItems(List<RABillItem> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
