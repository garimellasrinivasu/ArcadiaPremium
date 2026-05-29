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
@Table(name = "work_orders")
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Auto-generated: WO-001, WO-002, etc. */
    @Column(nullable = false, unique = true)
    private String woNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contractor_id", nullable = false)
    private Contractor contractor;

    @Column(nullable = false)
    private LocalDate woDate;

    /** Start date of work */
    private LocalDate startDate;

    /** Expected completion date */
    private LocalDate endDate;

    /** DRAFT, ISSUED, IN_PROGRESS, COMPLETED, CANCELLED */
    @Column(nullable = false)
    private String status = "DRAFT";

    /** Total WO value = sum of all items */
    @Column(precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(length = 2000)
    private String termsAndConditions;

    @Column(length = 1000)
    private String remarks;

    private String contractType;

    private String woAdvanceType;

    @Column(precision = 15, scale = 2)
    private BigDecimal woAdvanceValue;

    private String woRetentionType;

    @Column(precision = 15, scale = 2)
    private BigDecimal woRetentionValue;

    private Integer workDuration;

    private String defectLiabilityPeriod;

    private LocalDate dateOfCompletion;

    private String contactPerson;

    @Column(length = 2000)
    private String workOrderTitle;

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkOrderItem> items = new ArrayList<>();

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public WorkOrder() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getWoNumber() { return woNumber; }
    public void setWoNumber(String woNumber) { this.woNumber = woNumber; }
    public Job getJob() { return job; }
    public void setJob(Job job) { this.job = job; }
    public Contractor getContractor() { return contractor; }
    public void setContractor(Contractor contractor) { this.contractor = contractor; }
    public LocalDate getWoDate() { return woDate; }
    public void setWoDate(LocalDate woDate) { this.woDate = woDate; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getTermsAndConditions() { return termsAndConditions; }
    public void setTermsAndConditions(String termsAndConditions) { this.termsAndConditions = termsAndConditions; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<WorkOrderItem> getItems() { return items; }
    public void setItems(List<WorkOrderItem> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public String getContractType() { return contractType; }
    public void setContractType(String contractType) { this.contractType = contractType; }
    public String getWoAdvanceType() { return woAdvanceType; }
    public void setWoAdvanceType(String woAdvanceType) { this.woAdvanceType = woAdvanceType; }
    public BigDecimal getWoAdvanceValue() { return woAdvanceValue; }
    public void setWoAdvanceValue(BigDecimal woAdvanceValue) { this.woAdvanceValue = woAdvanceValue; }
    public String getWoRetentionType() { return woRetentionType; }
    public void setWoRetentionType(String woRetentionType) { this.woRetentionType = woRetentionType; }
    public BigDecimal getWoRetentionValue() { return woRetentionValue; }
    public void setWoRetentionValue(BigDecimal woRetentionValue) { this.woRetentionValue = woRetentionValue; }
    public Integer getWorkDuration() { return workDuration; }
    public void setWorkDuration(Integer workDuration) { this.workDuration = workDuration; }
    public String getDefectLiabilityPeriod() { return defectLiabilityPeriod; }
    public void setDefectLiabilityPeriod(String defectLiabilityPeriod) { this.defectLiabilityPeriod = defectLiabilityPeriod; }
    public LocalDate getDateOfCompletion() { return dateOfCompletion; }
    public void setDateOfCompletion(LocalDate dateOfCompletion) { this.dateOfCompletion = dateOfCompletion; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getWorkOrderTitle() { return workOrderTitle; }
    public void setWorkOrderTitle(String workOrderTitle) { this.workOrderTitle = workOrderTitle; }
}
