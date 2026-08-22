package com.arcadia.premium.dto;

import com.arcadia.premium.model.InvoiceBookEntry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class InvoiceBookEntryDto {

    private Long id;
    private String projectName;
    private Integer serialNumber;
    private String invoiceNo;
    private String supplierContractorName;
    private LocalDate invoiceDate;
    private BigDecimal invoiceValue;
    private String materialWorkDetails;
    private String invoiceNarration;
    private Boolean updatedInTally;
    private String entryMode;
    private String invoiceImageBase64; // only populated for single-item responses
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Convert entity to DTO, including image data (for single-item responses).
     */
    public static InvoiceBookEntryDto fromEntity(InvoiceBookEntry e) {
        InvoiceBookEntryDto d = new InvoiceBookEntryDto();
        d.id = e.getId();
        d.projectName = e.getProjectName();
        d.serialNumber = e.getSerialNumber();
        d.invoiceNo = e.getInvoiceNo();
        d.supplierContractorName = e.getSupplierContractorName();
        d.invoiceDate = e.getInvoiceDate();
        d.invoiceValue = e.getInvoiceValue();
        d.materialWorkDetails = e.getMaterialWorkDetails();
        d.invoiceNarration = e.getInvoiceNarration();
        d.updatedInTally = e.getUpdatedInTally();
        d.entryMode = e.getEntryMode();
        d.invoiceImageBase64 = e.getInvoiceImageBase64();
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    /**
     * Convert entity to DTO WITHOUT image data (for list responses — performance).
     */
    public static InvoiceBookEntryDto fromEntityWithoutImage(InvoiceBookEntry e) {
        InvoiceBookEntryDto d = new InvoiceBookEntryDto();
        d.id = e.getId();
        d.projectName = e.getProjectName();
        d.serialNumber = e.getSerialNumber();
        d.invoiceNo = e.getInvoiceNo();
        d.supplierContractorName = e.getSupplierContractorName();
        d.invoiceDate = e.getInvoiceDate();
        d.invoiceValue = e.getInvoiceValue();
        d.materialWorkDetails = e.getMaterialWorkDetails();
        d.invoiceNarration = e.getInvoiceNarration();
        d.updatedInTally = e.getUpdatedInTally();
        d.entryMode = e.getEntryMode();
        // invoiceImageBase64 intentionally omitted
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    /**
     * Convert this DTO to a new entity (for create).
     */
    public InvoiceBookEntry toEntity() {
        InvoiceBookEntry e = new InvoiceBookEntry();
        e.setProjectName(this.projectName);
        e.setInvoiceNo(this.invoiceNo);
        e.setSupplierContractorName(this.supplierContractorName);
        e.setInvoiceDate(this.invoiceDate);
        e.setInvoiceValue(this.invoiceValue);
        e.setMaterialWorkDetails(this.materialWorkDetails);
        e.setInvoiceNarration(this.invoiceNarration);
        e.setUpdatedInTally(this.updatedInTally != null ? this.updatedInTally : false);
        e.setEntryMode(this.entryMode != null ? this.entryMode : "MANUAL");
        e.setInvoiceImageBase64(this.invoiceImageBase64);
        e.setCreatedBy(this.createdBy);
        return e;
    }

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
