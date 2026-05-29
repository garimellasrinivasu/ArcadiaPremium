package com.arcadia.premium.dto;

import com.arcadia.premium.model.EstimationDOM;

import java.math.BigDecimal;

public class EstimationDOMDto {

    private Long id;
    private Long jobEstimationId;
    private Integer itemNo;
    private String description;
    private BigDecimal nos;
    private BigDecimal length;
    private BigDecimal breadth;
    private BigDecimal height;
    private BigDecimal quantity;

    public static EstimationDOMDto fromEntity(EstimationDOM e) {
        EstimationDOMDto d = new EstimationDOMDto();
        d.id = e.getId();
        if (e.getJobEstimation() != null) {
            d.jobEstimationId = e.getJobEstimation().getId();
        }
        d.itemNo = e.getItemNo();
        d.description = e.getDescription();
        d.nos = e.getNos();
        d.length = e.getLength();
        d.breadth = e.getBreadth();
        d.height = e.getHeight();
        d.quantity = e.getQuantity();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getJobEstimationId() { return jobEstimationId; }
    public void setJobEstimationId(Long jobEstimationId) { this.jobEstimationId = jobEstimationId; }
    public Integer getItemNo() { return itemNo; }
    public void setItemNo(Integer itemNo) { this.itemNo = itemNo; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getNos() { return nos; }
    public void setNos(BigDecimal nos) { this.nos = nos; }
    public BigDecimal getLength() { return length; }
    public void setLength(BigDecimal length) { this.length = length; }
    public BigDecimal getBreadth() { return breadth; }
    public void setBreadth(BigDecimal breadth) { this.breadth = breadth; }
    public BigDecimal getHeight() { return height; }
    public void setHeight(BigDecimal height) { this.height = height; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
}
