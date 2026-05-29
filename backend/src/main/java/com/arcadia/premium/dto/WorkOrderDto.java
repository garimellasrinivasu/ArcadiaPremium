package com.arcadia.premium.dto;

import com.arcadia.premium.model.WorkOrder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class WorkOrderDto {

    private Long id;
    private String woNumber;
    private Long jobId;
    private String jobName;
    private Long contractorId;
    private String contractorName;
    private LocalDate woDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private BigDecimal totalAmount;
    private String termsAndConditions;
    private String remarks;
    private List<WorkOrderItemDto> items;
    private String contractType;
    private String woAdvanceType;
    private BigDecimal woAdvanceValue;
    private String woRetentionType;
    private BigDecimal woRetentionValue;
    private Integer workDuration;
    private String defectLiabilityPeriod;
    private LocalDate dateOfCompletion;
    private String contactPerson;
    private String workOrderTitle;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WorkOrderDto fromEntity(WorkOrder e) {
        WorkOrderDto d = new WorkOrderDto();
        d.id = e.getId();
        d.woNumber = e.getWoNumber();
        if (e.getJob() != null) {
            d.jobId = e.getJob().getId();
            d.jobName = e.getJob().getName();
        }
        if (e.getContractor() != null) {
            d.contractorId = e.getContractor().getId();
            d.contractorName = e.getContractor().getName();
        }
        d.woDate = e.getWoDate();
        d.startDate = e.getStartDate();
        d.endDate = e.getEndDate();
        d.status = e.getStatus();
        d.totalAmount = e.getTotalAmount();
        d.termsAndConditions = e.getTermsAndConditions();
        d.remarks = e.getRemarks();
        d.contractType = e.getContractType();
        d.woAdvanceType = e.getWoAdvanceType();
        d.woAdvanceValue = e.getWoAdvanceValue();
        d.woRetentionType = e.getWoRetentionType();
        d.woRetentionValue = e.getWoRetentionValue();
        d.workDuration = e.getWorkDuration();
        d.defectLiabilityPeriod = e.getDefectLiabilityPeriod();
        d.dateOfCompletion = e.getDateOfCompletion();
        d.contactPerson = e.getContactPerson();
        d.workOrderTitle = e.getWorkOrderTitle();
        if (e.getItems() != null) {
            d.items = e.getItems().stream()
                    .map(WorkOrderItemDto::fromEntity)
                    .collect(Collectors.toList());
        }
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getWoNumber() { return woNumber; }
    public void setWoNumber(String woNumber) { this.woNumber = woNumber; }
    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }
    public String getJobName() { return jobName; }
    public void setJobName(String jobName) { this.jobName = jobName; }
    public Long getContractorId() { return contractorId; }
    public void setContractorId(Long contractorId) { this.contractorId = contractorId; }
    public String getContractorName() { return contractorName; }
    public void setContractorName(String contractorName) { this.contractorName = contractorName; }
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
    public List<WorkOrderItemDto> getItems() { return items; }
    public void setItems(List<WorkOrderItemDto> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

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
