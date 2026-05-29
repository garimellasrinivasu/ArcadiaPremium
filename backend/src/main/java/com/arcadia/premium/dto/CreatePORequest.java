package com.arcadia.premium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreatePORequest {
    private Long projectId;
    private Long vendorId;
    private LocalDate poDate;
    private LocalDate deliveryDate;
    private String referenceType;
    private Long indentId;
    private Double advancePercent;
    private String billingTerms;
    private String packingForwarding;
    private String paymentTerms;
    private String remarks;
    private List<POItemRequest> items;

    public static class POItemRequest {
        private Long materialId;
        private String description;
        private String uom;
        private BigDecimal poQty;
        private BigDecimal poRate;

        public Long getMaterialId() { return materialId; }
        public void setMaterialId(Long materialId) { this.materialId = materialId; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getUom() { return uom; }
        public void setUom(String uom) { this.uom = uom; }
        public BigDecimal getPoQty() { return poQty; }
        public void setPoQty(BigDecimal poQty) { this.poQty = poQty; }
        public BigDecimal getPoRate() { return poRate; }
        public void setPoRate(BigDecimal poRate) { this.poRate = poRate; }
    }

    // Getters and Setters
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public LocalDate getPoDate() { return poDate; }
    public void setPoDate(LocalDate poDate) { this.poDate = poDate; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }
    public Long getIndentId() { return indentId; }
    public void setIndentId(Long indentId) { this.indentId = indentId; }
    public Double getAdvancePercent() { return advancePercent; }
    public void setAdvancePercent(Double advancePercent) { this.advancePercent = advancePercent; }
    public String getBillingTerms() { return billingTerms; }
    public void setBillingTerms(String billingTerms) { this.billingTerms = billingTerms; }
    public String getPackingForwarding() { return packingForwarding; }
    public void setPackingForwarding(String packingForwarding) { this.packingForwarding = packingForwarding; }
    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<POItemRequest> getItems() { return items; }
    public void setItems(List<POItemRequest> items) { this.items = items; }
}
