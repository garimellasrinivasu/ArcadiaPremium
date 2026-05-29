package com.arcadia.premium.dto;

import com.arcadia.premium.model.PurchaseOrderItem;

import java.math.BigDecimal;

public class PurchaseOrderItemDto {
    private Long id;
    private Long materialId;
    private String materialName;
    private String description;
    private String uom;
    private BigDecimal poQty;
    private BigDecimal poRate;
    private BigDecimal amount;
    private BigDecimal receivedQty;
    private BigDecimal billedQty;

    public static PurchaseOrderItemDto fromEntity(PurchaseOrderItem e) {
        PurchaseOrderItemDto d = new PurchaseOrderItemDto();
        d.id = e.getId();
        if (e.getMaterial() != null) {
            d.materialId = e.getMaterial().getId();
            d.materialName = e.getMaterial().getName();
        }
        d.description = e.getDescription();
        d.uom = e.getUom();
        d.poQty = e.getPoQty();
        d.poRate = e.getPoRate();
        d.amount = e.getAmount();
        d.receivedQty = e.getReceivedQty();
        d.billedQty = e.getBilledQty();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }
    public String getMaterialName() { return materialName; }
    public void setMaterialName(String materialName) { this.materialName = materialName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getPoQty() { return poQty; }
    public void setPoQty(BigDecimal poQty) { this.poQty = poQty; }
    public BigDecimal getPoRate() { return poRate; }
    public void setPoRate(BigDecimal poRate) { this.poRate = poRate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getReceivedQty() { return receivedQty; }
    public void setReceivedQty(BigDecimal receivedQty) { this.receivedQty = receivedQty; }
    public BigDecimal getBilledQty() { return billedQty; }
    public void setBilledQty(BigDecimal billedQty) { this.billedQty = billedQty; }
}
