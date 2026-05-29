package com.arcadia.premium.dto;

import java.math.BigDecimal;

public class CreateRequisitionItemRequest {
    private Long materialId;
    private String uom;
    private BigDecimal requisitionQty;
    private String remarks;

    // Getters and Setters
    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getRequisitionQty() { return requisitionQty; }
    public void setRequisitionQty(BigDecimal requisitionQty) { this.requisitionQty = requisitionQty; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
