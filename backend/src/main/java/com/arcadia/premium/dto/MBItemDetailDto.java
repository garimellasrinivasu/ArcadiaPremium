package com.arcadia.premium.dto;

import com.arcadia.premium.model.MBItemDetail;

import java.math.BigDecimal;

public class MBItemDetailDto {
    private Long id;
    private Integer itemNo;
    private String description;
    private String operand;
    private BigDecimal nos;
    private BigDecimal length;
    private BigDecimal breadth;
    private BigDecimal height;
    private BigDecimal quantity;

    public static MBItemDetailDto fromEntity(MBItemDetail e) {
        MBItemDetailDto d = new MBItemDetailDto();
        d.id = e.getId();
        d.itemNo = e.getItemNo();
        d.description = e.getDescription();
        d.operand = e.getOperand();
        d.nos = e.getNos();
        d.length = e.getLength();
        d.breadth = e.getBreadth();
        d.height = e.getHeight();
        d.quantity = e.getQuantity();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
}
