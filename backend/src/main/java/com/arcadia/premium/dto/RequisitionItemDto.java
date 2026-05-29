package com.arcadia.premium.dto;

import com.arcadia.premium.model.RequisitionItem;

import java.math.BigDecimal;

public class RequisitionItemDto {
    private Long id;
    private Long materialId;
    private String materialName;
    private String uom;
    private BigDecimal requisitionQty;
    private BigDecimal issuedQty;
    private BigDecimal indentedQty;
    private String remarks;

    public static RequisitionItemDto fromEntity(RequisitionItem e) {
        RequisitionItemDto d = new RequisitionItemDto();
        d.id = e.getId();
        if (e.getMaterial() != null) {
            d.materialId = e.getMaterial().getId();
            d.materialName = e.getMaterial().getName();
        }
        d.uom = e.getUom();
        d.requisitionQty = e.getRequisitionQty();
        d.issuedQty = e.getIssuedQty();
        d.indentedQty = e.getIndentedQty();
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
    public BigDecimal getRequisitionQty() { return requisitionQty; }
    public void setRequisitionQty(BigDecimal requisitionQty) { this.requisitionQty = requisitionQty; }
    public BigDecimal getIssuedQty() { return issuedQty; }
    public void setIssuedQty(BigDecimal issuedQty) { this.issuedQty = issuedQty; }
    public BigDecimal getIndentedQty() { return indentedQty; }
    public void setIndentedQty(BigDecimal indentedQty) { this.indentedQty = indentedQty; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
