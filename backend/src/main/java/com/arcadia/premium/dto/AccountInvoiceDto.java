package com.arcadia.premium.dto;

import com.arcadia.premium.model.AccountInvoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AccountInvoiceDto {

    private Long id;
    private Long entryId;
    private LocalDate invoiceDate;
    private BigDecimal amount;
    private String description;
    private LocalDateTime createdAt;

    public static AccountInvoiceDto fromEntity(AccountInvoice e) {
        AccountInvoiceDto d = new AccountInvoiceDto();
        d.id = e.getId();
        d.entryId = e.getEntry() != null ? e.getEntry().getId() : null;
        d.invoiceDate = e.getInvoiceDate();
        d.amount = e.getAmount();
        d.description = e.getDescription();
        d.createdAt = e.getCreatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEntryId() { return entryId; }
    public void setEntryId(Long entryId) { this.entryId = entryId; }

    public LocalDate getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDate invoiceDate) { this.invoiceDate = invoiceDate; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
