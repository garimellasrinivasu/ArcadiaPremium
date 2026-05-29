package com.arcadia.premium.dto;

import com.arcadia.premium.model.RABillItem;

import java.math.BigDecimal;

public class RABillItemDto {
    private Long id;
    private Long activityId;
    private String activityName;
    private Long measurementBookId;
    private String mbNumber;
    private String uom;
    private BigDecimal woQty;
    private BigDecimal woRate;
    private BigDecimal previousQty;
    private BigDecimal currentQty;
    private BigDecimal cumulativeQty;
    private BigDecimal currentAmount;
    private BigDecimal cumulativeAmount;
    private Double paymentReleasePercent;

    public static RABillItemDto fromEntity(RABillItem e) {
        RABillItemDto d = new RABillItemDto();
        d.id = e.getId();
        if (e.getActivity() != null) {
            d.activityId = e.getActivity().getId();
            d.activityName = e.getActivity().getName();
        }
        if (e.getMeasurementBook() != null) {
            d.measurementBookId = e.getMeasurementBook().getId();
            d.mbNumber = e.getMeasurementBook().getMbNumber();
        }
        d.uom = e.getUom();
        d.woQty = e.getWoQty();
        d.woRate = e.getWoRate();
        d.previousQty = e.getPreviousQty();
        d.currentQty = e.getCurrentQty();
        d.cumulativeQty = e.getCumulativeQty();
        d.currentAmount = e.getCurrentAmount();
        d.cumulativeAmount = e.getCumulativeAmount();
        d.paymentReleasePercent = e.getPaymentReleasePercent();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getActivityId() { return activityId; }
    public void setActivityId(Long activityId) { this.activityId = activityId; }
    public String getActivityName() { return activityName; }
    public void setActivityName(String activityName) { this.activityName = activityName; }
    public Long getMeasurementBookId() { return measurementBookId; }
    public void setMeasurementBookId(Long measurementBookId) { this.measurementBookId = measurementBookId; }
    public String getMbNumber() { return mbNumber; }
    public void setMbNumber(String mbNumber) { this.mbNumber = mbNumber; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getWoQty() { return woQty; }
    public void setWoQty(BigDecimal woQty) { this.woQty = woQty; }
    public BigDecimal getWoRate() { return woRate; }
    public void setWoRate(BigDecimal woRate) { this.woRate = woRate; }
    public BigDecimal getPreviousQty() { return previousQty; }
    public void setPreviousQty(BigDecimal previousQty) { this.previousQty = previousQty; }
    public BigDecimal getCurrentQty() { return currentQty; }
    public void setCurrentQty(BigDecimal currentQty) { this.currentQty = currentQty; }
    public BigDecimal getCumulativeQty() { return cumulativeQty; }
    public void setCumulativeQty(BigDecimal cumulativeQty) { this.cumulativeQty = cumulativeQty; }
    public BigDecimal getCurrentAmount() { return currentAmount; }
    public void setCurrentAmount(BigDecimal currentAmount) { this.currentAmount = currentAmount; }
    public BigDecimal getCumulativeAmount() { return cumulativeAmount; }
    public void setCumulativeAmount(BigDecimal cumulativeAmount) { this.cumulativeAmount = cumulativeAmount; }
    public Double getPaymentReleasePercent() { return paymentReleasePercent; }
    public void setPaymentReleasePercent(Double paymentReleasePercent) { this.paymentReleasePercent = paymentReleasePercent; }
}
