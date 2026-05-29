package com.arcadia.premium.dto;

import com.arcadia.premium.model.MaterialIssueItem;

import java.math.BigDecimal;

public class MaterialIssueItemDto {
    private Long id;
    private Long materialId;
    private String materialName;
    private String uom;
    private BigDecimal issueQty;
    private BigDecimal stockQty;
    private String remarks;

    public static MaterialIssueItemDto fromEntity(MaterialIssueItem e) {
        MaterialIssueItemDto d = new MaterialIssueItemDto();
        d.id = e.getId();
        if (e.getMaterial() != null) {
            d.materialId = e.getMaterial().getId();
            d.materialName = e.getMaterial().getName();
        }
        d.uom = e.getUom();
        d.issueQty = e.getIssueQty();
        d.stockQty = e.getStockQty();
        d.remarks = e.getRemarks();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }
    public String getMaterialName() { return materialName; }
    public void setMaterialName(String materialName) { this.materialName = materialName; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getIssueQty() { return issueQty; }
    public void setIssueQty(BigDecimal issueQty) { this.issueQty = issueQty; }
    public BigDecimal getStockQty() { return stockQty; }
    public void setStockQty(BigDecimal stockQty) { this.stockQty = stockQty; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
