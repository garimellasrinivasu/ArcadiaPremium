package com.arcadia.premium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreatePurchaseBillRequest {
    private Long purchaseOrderId;
    private LocalDate billDate;
    private String vendorInvoiceNo;
    private LocalDate vendorInvoiceDate;
    private BigDecimal discount;
    private BigDecimal freightCharges;
    private BigDecimal taxAmount;
    private String remarks;
    private List<BillItemRequest> items;

    public static class BillItemRequest {
        private Long materialId;
        private String uom;
        private BigDecimal billQty;
        private BigDecimal rate;

        public Long getMaterialId() { return materialId; }
        public void setMaterialId(Long materialId) { this.materialId = materialId; }
        public String getUom() { return uom; }
        public void setUom(String uom) { this.uom = uom; }
        public BigDecimal getBillQty() { return billQty; }
        public void setBillQty(BigDecimal billQty) { this.billQty = billQty; }
        public BigDecimal getRate() { return rate; }
        public void setRate(BigDecimal rate) { this.rate = rate; }
    }

    public Long getPurchaseOrderId() { return purchaseOrderId; }
    public void setPurchaseOrderId(Long purchaseOrderId) { this.purchaseOrderId = purchaseOrderId; }
    public LocalDate getBillDate() { return billDate; }
    public void setBillDate(LocalDate billDate) { this.billDate = billDate; }
    public String getVendorInvoiceNo() { return vendorInvoiceNo; }
    public void setVendorInvoiceNo(String vendorInvoiceNo) { this.vendorInvoiceNo = vendorInvoiceNo; }
    public LocalDate getVendorInvoiceDate() { return vendorInvoiceDate; }
    public void setVendorInvoiceDate(LocalDate vendorInvoiceDate) { this.vendorInvoiceDate = vendorInvoiceDate; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }
    public BigDecimal getFreightCharges() { return freightCharges; }
    public void setFreightCharges(BigDecimal freightCharges) { this.freightCharges = freightCharges; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<BillItemRequest> getItems() { return items; }
    public void setItems(List<BillItemRequest> items) { this.items = items; }
}
