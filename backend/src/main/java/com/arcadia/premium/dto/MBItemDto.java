package com.arcadia.premium.dto;

import com.arcadia.premium.model.MeasurementBookItem;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

public class MBItemDto {
    private Long id;
    private Long activityId;
    private String activityName;
    private String uom;
    private BigDecimal previousMeasuredQty;
    private BigDecimal currentMeasuredQty;
    private BigDecimal cumulativeMeasuredQty;
    private BigDecimal woQty;
    private String remarks;
    private List<MBItemDetailDto> details;

    public static MBItemDto fromEntity(MeasurementBookItem e) {
        MBItemDto d = new MBItemDto();
        d.id = e.getId();
        if (e.getActivity() != null) {
            d.activityId = e.getActivity().getId();
            d.activityName = e.getActivity().getName();
        }
        d.uom = e.getUom();
        d.previousMeasuredQty = e.getPreviousMeasuredQty();
        d.currentMeasuredQty = e.getCurrentMeasuredQty();
        d.cumulativeMeasuredQty = e.getCumulativeMeasuredQty();
        d.woQty = e.getWoQty();
        d.remarks = e.getRemarks();
        if (e.getDetails() != null) {
            d.details = e.getDetails().stream().map(MBItemDetailDto::fromEntity).collect(Collectors.toList());
        }
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getActivityId() { return activityId; }
    public void setActivityId(Long activityId) { this.activityId = activityId; }
    public String getActivityName() { return activityName; }
    public void setActivityName(String activityName) { this.activityName = activityName; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getPreviousMeasuredQty() { return previousMeasuredQty; }
    public void setPreviousMeasuredQty(BigDecimal previousMeasuredQty) { this.previousMeasuredQty = previousMeasuredQty; }
    public BigDecimal getCurrentMeasuredQty() { return currentMeasuredQty; }
    public void setCurrentMeasuredQty(BigDecimal currentMeasuredQty) { this.currentMeasuredQty = currentMeasuredQty; }
    public BigDecimal getCumulativeMeasuredQty() { return cumulativeMeasuredQty; }
    public void setCumulativeMeasuredQty(BigDecimal cumulativeMeasuredQty) { this.cumulativeMeasuredQty = cumulativeMeasuredQty; }
    public BigDecimal getWoQty() { return woQty; }
    public void setWoQty(BigDecimal woQty) { this.woQty = woQty; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<MBItemDetailDto> getDetails() { return details; }
    public void setDetails(List<MBItemDetailDto> details) { this.details = details; }
}
