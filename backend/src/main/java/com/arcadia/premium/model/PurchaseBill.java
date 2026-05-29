package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchase_bills")
public class PurchaseBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Auto-generated: PB-001, PB-002, etc. */
    @Column(nullable = false, unique = true)
    private String billNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(nullable = false)
    private LocalDate billDate;

    private String vendorInvoiceNo;

    private LocalDate vendorInvoiceDate;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalBillAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal recoveryAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal netAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal freightCharges = BigDecimal.ZERO;

    @Column(nullable = false)
    private String status = "DRAFT";

    private String remarks;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String vendorInvoiceFile;

    private String vendorInvoiceFileName;

    @OneToMany(mappedBy = "purchaseBill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseBillItem> items = new ArrayList<>();

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public PurchaseBill() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBillNo() { return billNo; }
    public void setBillNo(String billNo) { this.billNo = billNo; }
    public PurchaseOrder getPurchaseOrder() { return purchaseOrder; }
    public void setPurchaseOrder(PurchaseOrder purchaseOrder) { this.purchaseOrder = purchaseOrder; }
    public Vendor getVendor() { return vendor; }
    public void setVendor(Vendor vendor) { this.vendor = vendor; }
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
    public List<PurchaseBillItem> getItems() { return items; }
    public void setItems(List<PurchaseBillItem> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getVendorInvoiceFile() { return vendorInvoiceFile; }
    public void setVendorInvoiceFile(String vendorInvoiceFile) { this.vendorInvoiceFile = vendorInvoiceFile; }
    public String getVendorInvoiceFileName() { return vendorInvoiceFileName; }
    public void setVendorInvoiceFileName(String vendorInvoiceFileName) { this.vendorInvoiceFileName = vendorInvoiceFileName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
