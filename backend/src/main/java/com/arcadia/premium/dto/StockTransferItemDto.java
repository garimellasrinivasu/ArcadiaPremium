package com.arcadia.premium.dto;

import com.arcadia.premium.model.StockTransferItem;

import java.math.BigDecimal;

public class StockTransferItemDto {
    private Long id;
    private Long materialId;
    private String materialName;
    private String uom;
    private BigDecimal transferQty;
    private BigDecimal stockQty;
    private String remarks;

    public static StockTransferItemDto fromEntity(StockTransferItem e) {
        StockTransferItemDto d = new StockTransferItemDto();
        d.id = e.getId();
        if (e.getMaterial() != null) {
            d.materialId = e.getMaterial().getId();
            d.materialName = e.getMaterial().getName();
        }
        d.uom = e.getUom();
        d.transferQty = e.getTransferQty();
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
    public BigDecimal getTransferQty() { return transferQty; }
    public void setTransferQty(BigDecimal transferQty) { this.transferQty = transferQty; }
    public BigDecimal getStockQty() { return stockQty; }
    public void setStockQty(BigDecimal stockQty) { this.stockQty = stockQty; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
