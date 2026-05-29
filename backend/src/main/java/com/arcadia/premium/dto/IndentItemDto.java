package com.arcadia.premium.dto;

import com.arcadia.premium.model.IndentItem;

import java.math.BigDecimal;

public class IndentItemDto {
    private Long id;
    private Long materialId;
    private String materialName;
    private String uom;
    private BigDecimal indentQty;
    private BigDecimal poQty;
    private String remarks;

    public static IndentItemDto fromEntity(IndentItem e) {
        IndentItemDto d = new IndentItemDto();
        d.id = e.getId();
        if (e.getMaterial() != null) {
            d.materialId = e.getMaterial().getId();
            d.materialName = e.getMaterial().getName();
        }
        d.uom = e.getUom();
        d.indentQty = e.getIndentQty();
        d.poQty = e.getPoQty();
        d.remarks = e.getRemarks();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }
    public String getMaterialName() { return materialName; }
    public void setMaterialName(String materialName) { this.materialName = materialName; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getIndentQty() { return indentQty; }
    public void setIndentQty(BigDecimal indentQty) { this.indentQty = indentQty; }
    public BigDecimal getPoQty() { return poQty; }
    public void setPoQty(BigDecimal poQty) { this.poQty = poQty; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
