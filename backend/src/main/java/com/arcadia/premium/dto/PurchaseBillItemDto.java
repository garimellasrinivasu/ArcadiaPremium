package com.arcadia.premium.dto;

import com.arcadia.premium.model.PurchaseBillItem;

import java.math.BigDecimal;

public class PurchaseBillItemDto {
    private Long id;
    private Long materialId;
    private String materialName;
    private String uom;
    private BigDecimal billQty;
    private BigDecimal rate;
    private BigDecimal amount;

    public static PurchaseBillItemDto fromEntity(PurchaseBillItem e) {
        PurchaseBillItemDto d = new PurchaseBillItemDto();
        d.id = e.getId();
        if (e.getMaterial() != null) {
            d.materialId = e.getMaterial().getId();
            d.materialName = e.getMaterial().getName();
        }
        d.uom = e.getUom();
        d.billQty = e.getBillQty();
        d.rate = e.getRate();
        d.amount = e.getAmount();
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
    public BigDecimal getBillQty() { return billQty; }
    public void setBillQty(BigDecimal billQty) { this.billQty = billQty; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
