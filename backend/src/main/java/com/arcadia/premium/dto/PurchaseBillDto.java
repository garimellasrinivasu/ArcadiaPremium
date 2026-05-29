package com.arcadia.premium.dto;

import com.arcadia.premium.model.PurchaseBill;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class PurchaseBillDto {
    private Long id;
    private String billNo;
    private Long purchaseOrderId;
    private String poNumber;
    private Long vendorId;
    private String vendorName;
    private LocalDate billDate;
    private String vendorInvoiceNo;
    private LocalDate vendorInvoiceDate;
    private BigDecimal totalBillAmount;
    private BigDecimal recoveryAmount;
    private BigDecimal netAmount;
    private BigDecimal taxAmount;
    private BigDecimal discount;
    private BigDecimal freightCharges;
    private String status;
    private String remarks;
    private String vendorInvoiceFile;
    private String vendorInvoiceFileName;
    private List<PurchaseBillItemDto> items;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PurchaseBillDto fromEntity(PurchaseBill e) {
        PurchaseBillDto d = new PurchaseBillDto();
        d.id = e.getId();
        d.billNo = e.getBillNo();
        if (e.getPurchaseOrder() != null) {
            d.purchaseOrderId = e.getPurchaseOrder().getId();
            d.poNumber = e.getPurchaseOrder().getPoNumber();
        }
        if (e.getVendor() != null) {
            d.vendorId = e.getVendor().getId();
            d.vendorName = e.getVendor().getName();
        }
        d.billDate = e.getBillDate();
        d.vendorInvoiceNo = e.getVendorInvoiceNo();
        d.vendorInvoiceDate = e.getVendorInvoiceDate();
        d.totalBillAmount = e.getTotalBillAmount();
        d.recoveryAmount = e.getRecoveryAmount();
        d.netAmount = e.getNetAmount();
        d.taxAmount = e.getTaxAmount();
        d.discount = e.getDiscount();
        d.freightCharges = e.getFreightCharges();
        d.vendorInvoiceFile = e.getVendorInvoiceFile();
        d.vendorInvoiceFileName = e.getVendorInvoiceFileName();
        d.status = e.getStatus();
        d.remarks = e.getRemarks();
        if (e.getItems() != null) {
            d.items = e.getItems().stream().map(PurchaseBillItemDto::fromEntity).collect(Collectors.toList());
        }
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBillNo() { return billNo; }
    public void setBillNo(String billNo) { this.billNo = billNo; }
    public Long getPurchaseOrderId() { return purchaseOrderId; }
    public void setPurchaseOrderId(Long purchaseOrderId) { this.purchaseOrderId = purchaseOrderId; }
    public String getPoNumber() { return poNumber; }
    public void setPoNumber(String poNumber) { this.poNumber = poNumber; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public LocalDate getBillDate() { return billDate; }
    public void setBillDate(LocalDate billDate) { this.billDate = billDate; }
    public String getVendorInvoiceNo() { return vendorInvoiceNo; }
    public void setVendorInvoiceNo(String vendorInvoiceNo) { this.vendorInvoiceNo = vendorInvoiceNo; }
    public LocalDate getVendorInvoiceDate() { return vendorInvoiceDate; }
    public void setVendorInvoiceDate(LocalDate vendorInvoiceDate) { this.vendorInvoiceDate = vendorInvoiceDate; }
    public BigDecimal getTotalBillAmount() { return totalBillAmount; }
    public void setTotalBillAmount(BigDecimal totalBillAmount) { this.totalBillAmount = totalBillAmount; }
    public BigDecimal getRecoveryAmount() { return recoveryAmount; }
    public void setRecoveryAmount(BigDecimal recoveryAmount) { this.recoveryAmount = recoveryAmount; }
    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }
    public BigDecimal getFreightCharges() { return freightCharges; }
    public void setFreightCharges(BigDecimal freightCharges) { this.freightCharges = freightCharges; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getVendorInvoiceFile() { return vendorInvoiceFile; }
    public void setVendorInvoiceFile(String vendorInvoiceFile) { this.vendorInvoiceFile = vendorInvoiceFile; }
    public String getVendorInvoiceFileName() { return vendorInvoiceFileName; }
    public void setVendorInvoiceFileName(String vendorInvoiceFileName) { this.vendorInvoiceFileName = vendorInvoiceFileName; }
    public List<PurchaseBillItemDto> getItems() { return items; }
    public void setItems(List<PurchaseBillItemDto> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
