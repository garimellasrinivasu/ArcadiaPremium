package com.arcadia.premium.dto;

import com.arcadia.premium.model.PurchaseOrder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class PurchaseOrderDto {
    private Long id;
    private String poNumber;
    private Long projectId;
    private String projectName;
    private Long vendorId;
    private String vendorName;
    private LocalDate poDate;
    private LocalDate deliveryDate;
    private String referenceType;
    private Long indentId;
    private String indentNo;
    private Double advancePercent;
    private BigDecimal totalAmount;
    private BigDecimal taxAmount;
    private BigDecimal grandTotal;
    private String status;
    private String billingTerms;
    private String paymentTerms;
    private String remarks;
    private List<PurchaseOrderItemDto> items;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PurchaseOrderDto fromEntity(PurchaseOrder e) {
        PurchaseOrderDto d = new PurchaseOrderDto();
        d.id = e.getId();
        d.poNumber = e.getPoNumber();
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        if (e.getVendor() != null) {
            d.vendorId = e.getVendor().getId();
            d.vendorName = e.getVendor().getName();
        }
        d.poDate = e.getPoDate();
        d.deliveryDate = e.getDeliveryDate();
        d.referenceType = e.getReferenceType();
        if (e.getIndent() != null) {
            d.indentId = e.getIndent().getId();
            d.indentNo = e.getIndent().getIndentNo();
        }
        d.advancePercent = e.getAdvancePercent();
        d.totalAmount = e.getTotalAmount();
        d.taxAmount = e.getTaxAmount();
        d.grandTotal = e.getGrandTotal();
        d.status = e.getStatus();
        d.billingTerms = e.getBillingTerms();
        d.paymentTerms = e.getPaymentTerms();
        d.remarks = e.getRemarks();
        if (e.getItems() != null) {
            d.items = e.getItems().stream().map(PurchaseOrderItemDto::fromEntity).collect(Collectors.toList());
        }
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPoNumber() { return poNumber; }
    public void setPoNumber(String poNumber) { this.poNumber = poNumber; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public LocalDate getPoDate() { return poDate; }
    public void setPoDate(LocalDate poDate) { this.poDate = poDate; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }
    public Long getIndentId() { return indentId; }
    public void setIndentId(Long indentId) { this.indentId = indentId; }
    public String getIndentNo() { return indentNo; }
    public void setIndentNo(String indentNo) { this.indentNo = indentNo; }
    public Double getAdvancePercent() { return advancePercent; }
    public void setAdvancePercent(Double advancePercent) { this.advancePercent = advancePercent; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getBillingTerms() { return billingTerms; }
    public void setBillingTerms(String billingTerms) { this.billingTerms = billingTerms; }
    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<PurchaseOrderItemDto> getItems() { return items; }
    public void setItems(List<PurchaseOrderItemDto> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
