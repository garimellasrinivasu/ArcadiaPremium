package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreateWorkOrderRequest {

    @NotNull(message = "Job is required")
    private Long jobId;

    @NotNull(message = "Contractor is required")
    private Long contractorId;

    @NotNull(message = "Work order date is required")
    private LocalDate woDate;

    private LocalDate startDate;
    private LocalDate endDate;
    private String termsAndConditions;
    private String remarks;
    private List<CreateWorkOrderItemRequest> items;
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

    // Getters and Setters
    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }
    public Long getContractorId() { return contractorId; }
    public void setContractorId(Long contractorId) { this.contractorId = contractorId; }
    public LocalDate getWoDate() { return woDate; }
    public void setWoDate(LocalDate woDate) { this.woDate = woDate; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getTermsAndConditions() { return termsAndConditions; }
    public void setTermsAndConditions(String termsAndConditions) { this.termsAndConditions = termsAndConditions; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<CreateWorkOrderItemRequest> getItems() { return items; }
    public void setItems(List<CreateWorkOrderItemRequest> items) { this.items = items; }

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
