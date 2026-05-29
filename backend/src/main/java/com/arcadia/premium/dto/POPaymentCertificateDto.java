package com.arcadia.premium.dto;

import com.arcadia.premium.model.POPaymentCertificate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class POPaymentCertificateDto {
    private Long id;
    private String certificateNo;
    private Long vendorId;
    private String vendorName;
    private LocalDate paymentDate;
    private String paymentMode;
    private String bankName;
    private String chequeNo;
    private LocalDate chequeDate;
    private BigDecimal totalAmount;
    private String remarks;
    private String status;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static POPaymentCertificateDto fromEntity(POPaymentCertificate e) {
        POPaymentCertificateDto d = new POPaymentCertificateDto();
        d.id = e.getId();
        d.certificateNo = e.getCertificateNo();
        if (e.getVendor() != null) {
            d.vendorId = e.getVendor().getId();
            d.vendorName = e.getVendor().getName();
        }
        d.paymentDate = e.getPaymentDate();
        d.paymentMode = e.getPaymentMode();
        d.bankName = e.getBankName();
        d.chequeNo = e.getChequeNo();
        d.chequeDate = e.getChequeDate();
        d.totalAmount = e.getTotalAmount();
        d.remarks = e.getRemarks();
        d.status = e.getStatus();
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCertificateNo() { return certificateNo; }
    public void setCertificateNo(String certificateNo) { this.certificateNo = certificateNo; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getChequeNo() { return chequeNo; }
    public void setChequeNo(String chequeNo) { this.chequeNo = chequeNo; }
    public LocalDate getChequeDate() { return chequeDate; }
    public void setChequeDate(LocalDate chequeDate) { this.chequeDate = chequeDate; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
