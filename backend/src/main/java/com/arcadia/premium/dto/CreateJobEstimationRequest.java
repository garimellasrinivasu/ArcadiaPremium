package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public class CreateJobEstimationRequest {

    @NotNull(message = "Job is required")
    private Long jobId;

    @NotNull(message = "Activity is required")
    private Long activityId;

    private BigDecimal quantity;
    private BigDecimal rate;
    private String remarks;
    private List<CreateEstimationDOMRequest> domDetails;

    // Getters and Setters
    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }
    public Long getActivityId() { return activityId; }
    public void setActivityId(Long activityId) { this.activityId = activityId; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<CreateEstimationDOMRequest> getDomDetails() { return domDetails; }
    public void setDomDetails(List<CreateEstimationDOMRequest> domDetails) { this.domDetails = domDetails; }
}
