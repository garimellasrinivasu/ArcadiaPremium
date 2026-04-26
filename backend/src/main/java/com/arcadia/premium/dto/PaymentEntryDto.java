package com.arcadia.premium.dto;

import com.arcadia.premium.model.PaymentEntry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PaymentEntryDto {

    private Long id;
    private Long saleEntryId;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String paymentMode;
    private String referenceNumber;
    private String remarks;
    private LocalDateTime createdAt;

    public static PaymentEntryDto fromEntity(PaymentEntry p) {
        PaymentEntryDto dto = new PaymentEntryDto();
        dto.id = p.getId();
        dto.saleEntryId = p.getSaleEntry().getId();
        dto.amount = p.getAmount();
        dto.paymentDate = p.getPaymentDate();
        dto.paymentMode = p.getPaymentMode();
        dto.referenceNumber = p.getReferenceNumber();
        dto.remarks = p.getRemarks();
        dto.createdAt = p.getCreatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSaleEntryId() { return saleEntryId; }
    public void setSaleEntryId(Long saleEntryId) { this.saleEntryId = saleEntryId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
