package com.arcadia.premium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreateMBRequest {
    private Long workOrderId;
    private LocalDate mbDate;
    private String remarks;
    private List<MBItemRequest> items;

    public static class MBItemRequest {
        private Long activityId;
        private String uom;
        private BigDecimal currentMeasuredQty;
        private List<DetailRequest> details;

        public Long getActivityId() { return activityId; }
        public void setActivityId(Long activityId) { this.activityId = activityId; }
        public String getUom() { return uom; }
        public void setUom(String uom) { this.uom = uom; }
        public BigDecimal getCurrentMeasuredQty() { return currentMeasuredQty; }
        public void setCurrentMeasuredQty(BigDecimal currentMeasuredQty) { this.currentMeasuredQty = currentMeasuredQty; }
        public List<DetailRequest> getDetails() { return details; }
        public void setDetails(List<DetailRequest> details) { this.details = details; }
    }

    public static class DetailRequest {
        private Integer itemNo;
        private String description;
        private String operand;
        private BigDecimal nos;
        private BigDecimal length;
        private BigDecimal breadth;
        private BigDecimal height;

        public Integer getItemNo() { return itemNo; }
        public void setItemNo(Integer itemNo) { this.itemNo = itemNo; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getOperand() { return operand; }
        public void setOperand(String operand) { this.operand = operand; }
        public BigDecimal getNos() { return nos; }
        public void setNos(BigDecimal nos) { this.nos = nos; }
        public BigDecimal getLength() { return length; }
        public void setLength(BigDecimal length) { this.length = length; }
        public BigDecimal getBreadth() { return breadth; }
        public void setBreadth(BigDecimal breadth) { this.breadth = breadth; }
        public BigDecimal getHeight() { return height; }
        public void setHeight(BigDecimal height) { this.height = height; }
    }

    public Long getWorkOrderId() { return workOrderId; }
    public void setWorkOrderId(Long workOrderId) { this.workOrderId = workOrderId; }
    public LocalDate getMbDate() { return mbDate; }
    public void setMbDate(LocalDate mbDate) { this.mbDate = mbDate; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<MBItemRequest> getItems() { return items; }
    public void setItems(List<MBItemRequest> items) { this.items = items; }
}
