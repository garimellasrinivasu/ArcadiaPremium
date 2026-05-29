package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreateWorkOrderItemRequest {

    @NotNull(message = "Activity is required")
    private Long activityId;

    private String description;
    private String uom;
    private BigDecimal quantity;
    private BigDecimal rate;

    // Getters and Setters
    public Long getActivityId() { return activityId; }
    public void setActivityId(Long activityId) { this.activityId = activityId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
}
