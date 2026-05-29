package com.arcadia.premium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreateRABillRequest {
    private Long workOrderId;
    private LocalDate billDate;
    private String billType;
    private String advanceCategory;
    private Double advancePercent;
    private BigDecimal advanceAmount;
    private String remarks;
    private List<RABillItemRequest> items;
    private List<AdjustmentRequest> adjustments;

    public static class RABillItemRequest {
        private Long activityId;
        private Long mbId;
        private BigDecimal currentQty;
        private BigDecimal woRate;
        private Double paymentReleasePercent;

        public Long getActivityId() { return activityId; }
        public void setActivityId(Long activityId) { this.activityId = activityId; }
        public Long getMbId() { return mbId; }
        public void setMbId(Long mbId) { this.mbId = mbId; }
        public BigDecimal getCurrentQty() { return currentQty; }
        public void setCurrentQty(BigDecimal currentQty) { this.currentQty = currentQty; }
        public BigDecimal getWoRate() { return woRate; }
        public void setWoRate(BigDecimal woRate) { this.woRate = woRate; }
        public Double getPaymentReleasePercent() { return paymentReleasePercent; }
        public void setPaymentReleasePercent(Double paymentReleasePercent) { this.paymentReleasePercent = paymentReleasePercent; }
    }

    public static class AdjustmentRequest {
        private String adjustmentType;
        private String nature;
        private String description;
        private BigDecimal amount;

        public String getAdjustmentType() { return adjustmentType; }
        public void setAdjustmentType(String adjustmentType) { this.adjustmentType = adjustmentType; }
        public String getNature() { return nature; }
        public void setNature(String nature) { this.nature = nature; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    public Long getWorkOrderId() { return workOrderId; }
    public void setWorkOrderId(Long workOrderId) { this.workOrderId = workOrderId; }
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
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<RABillItemRequest> getItems() { return items; }
    public void setItems(List<RABillItemRequest> items) { this.items = items; }
    public List<AdjustmentRequest> getAdjustments() { return adjustments; }
    public void setAdjustments(List<AdjustmentRequest> adjustments) { this.adjustments = adjustments; }
}
