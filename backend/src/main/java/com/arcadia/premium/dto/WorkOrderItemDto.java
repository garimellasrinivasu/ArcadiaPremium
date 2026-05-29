package com.arcadia.premium.dto;

import com.arcadia.premium.model.WorkOrderItem;

import java.math.BigDecimal;

public class WorkOrderItemDto {

    private Long id;
    private Long workOrderId;
    private Long activityId;
    private String activityName;
    private String description;
    private String uom;
    private BigDecimal quantity;
    private BigDecimal rate;
    private BigDecimal amount;

    public static WorkOrderItemDto fromEntity(WorkOrderItem e) {
        WorkOrderItemDto d = new WorkOrderItemDto();
        d.id = e.getId();
        if (e.getWorkOrder() != null) {
            d.workOrderId = e.getWorkOrder().getId();
        }
        if (e.getActivity() != null) {
            d.activityId = e.getActivity().getId();
            d.activityName = e.getActivity().getName();
        }
        d.description = e.getDescription();
        d.uom = e.getUom();
        d.quantity = e.getQuantity();
        d.rate = e.getRate();
        d.amount = e.getAmount();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getWorkOrderId() { return workOrderId; }
    public void setWorkOrderId(Long workOrderId) { this.workOrderId = workOrderId; }
    public Long getActivityId() { return activityId; }
    public void setActivityId(Long activityId) { this.activityId = activityId; }
    public String getActivityName() { return activityName; }
    public void setActivityName(String activityName) { this.activityName = activityName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
