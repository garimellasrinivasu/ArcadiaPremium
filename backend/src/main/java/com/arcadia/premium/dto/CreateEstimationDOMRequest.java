package com.arcadia.premium.dto;

import java.math.BigDecimal;

public class CreateEstimationDOMRequest {

    private Integer itemNo;
    private String description;
    private BigDecimal nos;
    private BigDecimal length;
    private BigDecimal breadth;
    private BigDecimal height;

    // Getters and Setters
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
}
