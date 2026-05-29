package com.arcadia.premium.dto;

import com.arcadia.premium.model.JobEstimation;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class JobEstimationDto {

    private Long id;
    private Long jobId;
    private String jobName;
    private Long activityId;
    private String activityName;
    private String activityUom;
    private BigDecimal quantity;
    private BigDecimal rate;
    private BigDecimal amount;
    private String remarks;
    private List<EstimationDOMDto> domDetails;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static JobEstimationDto fromEntity(JobEstimation e) {
        JobEstimationDto d = new JobEstimationDto();
        d.id = e.getId();
        if (e.getJob() != null) {
            d.jobId = e.getJob().getId();
            d.jobName = e.getJob().getName();
        }
        if (e.getActivity() != null) {
            d.activityId = e.getActivity().getId();
            d.activityName = e.getActivity().getName();
            d.activityUom = e.getActivity().getUom();
        }
        d.quantity = e.getQuantity();
        d.rate = e.getRate();
        d.amount = e.getAmount();
        d.remarks = e.getRemarks();
        if (e.getDomDetails() != null) {
            d.domDetails = e.getDomDetails().stream()
                    .map(EstimationDOMDto::fromEntity)
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
    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }
    public String getJobName() { return jobName; }
    public void setJobName(String jobName) { this.jobName = jobName; }
    public Long getActivityId() { return activityId; }
    public void setActivityId(Long activityId) { this.activityId = activityId; }
    public String getActivityName() { return activityName; }
    public void setActivityName(String activityName) { this.activityName = activityName; }
    public String getActivityUom() { return activityUom; }
    public void setActivityUom(String activityUom) { this.activityUom = activityUom; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<EstimationDOMDto> getDomDetails() { return domDetails; }
    public void setDomDetails(List<EstimationDOMDto> domDetails) { this.domDetails = domDetails; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
