package com.arcadia.premium.dto;

import com.arcadia.premium.model.RABillPaymentCertificate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class RABillPaymentCertificateDto {
    private Long id;
    private String certificateNo;
    private Long contractorId;
    private String contractorName;
    private Long workOrderId;
    private String woNumber;
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

    public static RABillPaymentCertificateDto fromEntity(RABillPaymentCertificate e) {
        RABillPaymentCertificateDto d = new RABillPaymentCertificateDto();
        d.id = e.getId();
        d.certificateNo = e.getCertificateNo();
        if (e.getContractor() != null) {
            d.contractorId = e.getContractor().getId();
            d.contractorName = e.getContractor().getName();
        }
        if (e.getWorkOrder() != null) {
            d.workOrderId = e.getWorkOrder().getId();
            d.woNumber = e.getWorkOrder().getWoNumber();
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
    public Long getContractorId() { return contractorId; }
    public void setContractorId(Long contractorId) { this.contractorId = contractorId; }
    public String getContractorName() { return contractorName; }
    public void setContractorName(String contractorName) { this.contractorName = contractorName; }
    public Long getWorkOrderId() { return workOrderId; }
    public void setWorkOrderId(Long workOrderId) { this.workOrderId = workOrderId; }
    public String getWoNumber() { return woNumber; }
    public void setWoNumber(String woNumber) { this.woNumber = woNumber; }
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
