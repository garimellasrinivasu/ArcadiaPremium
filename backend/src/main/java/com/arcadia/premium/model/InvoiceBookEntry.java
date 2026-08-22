package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_book_entries")
public class InvoiceBookEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String projectName;

    private Integer serialNumber; // auto-generated per project

    private String invoiceNo;

    private String supplierContractorName;

    private LocalDate invoiceDate;

    @Column(precision = 15, scale = 2)
    private BigDecimal invoiceValue;

    @Column(length = 1000)
    private String materialWorkDetails;

    @Column(length = 2000)
    private String invoiceNarration;

    private Boolean updatedInTally = false;

    @Column(nullable = false)
    private String entryMode; // MANUAL or IMAGE

    @Lob
    @Column(columnDefinition = "TEXT")
    private String invoiceImageBase64; // stored image for IMAGE mode

    private String createdBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public InvoiceBookEntry() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public Integer getSerialNumber() { return serialNumber; }
    public void setSerialNumber(Integer serialNumber) { this.serialNumber = serialNumber; }

    public String getInvoiceNo() { return invoiceNo; }
    public void setInvoiceNo(String invoiceNo) { this.invoiceNo = invoiceNo; }

    public String getSupplierContractorName() { return supplierContractorName; }
    public void setSupplierContractorName(String supplierContractorName) { this.supplierContractorName = supplierContractorName; }

    public LocalDate getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDate invoiceDate) { this.invoiceDate = invoiceDate; }

    public BigDecimal getInvoiceValue() { return invoiceValue; }
    public void setInvoiceValue(BigDecimal invoiceValue) { this.invoiceValue = invoiceValue; }

    public String getMaterialWorkDetails() { return materialWorkDetails; }
    public void setMaterialWorkDetails(String materialWorkDetails) { this.materialWorkDetails = materialWorkDetails; }

    public String getInvoiceNarration() { return invoiceNarration; }
    public void setInvoiceNarration(String invoiceNarration) { this.invoiceNarration = invoiceNarration; }

    public Boolean getUpdatedInTally() { return updatedInTally; }
    public void setUpdatedInTally(Boolean updatedInTally) { this.updatedInTally = updatedInTally; }

    public String getEntryMode() { return entryMode; }
    public void setEntryMode(String entryMode) { this.entryMode = entryMode; }

    public String getInvoiceImageBase64() { return invoiceImageBase64; }
    public void setInvoiceImageBase64(String invoiceImageBase64) { this.invoiceImageBase64 = invoiceImageBase64; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
