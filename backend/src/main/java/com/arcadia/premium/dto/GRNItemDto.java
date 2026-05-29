package com.arcadia.premium.dto;

import com.arcadia.premium.model.GRNItem;

import java.math.BigDecimal;

public class GRNItemDto {
    private Long id;
    private Long materialId;
    private String materialName;
    private String uom;
    private BigDecimal grnQty;
    private BigDecimal acceptedQty;
    private BigDecimal rejectedQty;
    private String inspectionType;
    private String inspectedBy;
    private String remarks;

    public static GRNItemDto fromEntity(GRNItem e) {
        GRNItemDto d = new GRNItemDto();
        d.id = e.getId();
        if (e.getMaterial() != null) {
            d.materialId = e.getMaterial().getId();
            d.materialName = e.getMaterial().getName();
        }
        d.uom = e.getUom();
        d.grnQty = e.getGrnQty();
        d.acceptedQty = e.getAcceptedQty();
        d.rejectedQty = e.getRejectedQty();
        d.inspectionType = e.getInspectionType();
        d.inspectedBy = e.getInspectedBy();
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
    public BigDecimal getGrnQty() { return grnQty; }
    public void setGrnQty(BigDecimal grnQty) { this.grnQty = grnQty; }
    public BigDecimal getAcceptedQty() { return acceptedQty; }
    public void setAcceptedQty(BigDecimal acceptedQty) { this.acceptedQty = acceptedQty; }
    public BigDecimal getRejectedQty() { return rejectedQty; }
    public void setRejectedQty(BigDecimal rejectedQty) { this.rejectedQty = rejectedQty; }
    public String getInspectionType() { return inspectionType; }
    public void setInspectionType(String inspectionType) { this.inspectionType = inspectionType; }
    public String getInspectedBy() { return inspectedBy; }
    public void setInspectedBy(String inspectedBy) { this.inspectedBy = inspectedBy; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
