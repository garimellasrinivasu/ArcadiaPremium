package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class UpdatePaymentRequest {

    @NotNull(message = "Received amount is required")
    private BigDecimal receivedAmount;

    private String remarks;

    public BigDecimal getReceivedAmount() { return receivedAmount; }
    public void setReceivedAmount(BigDecimal receivedAmount) { this.receivedAmount = receivedAmount; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
