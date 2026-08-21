package com.arcadia.premium.dto;

import com.arcadia.premium.model.AccountEntry;
import com.arcadia.premium.model.AccountInvoice;
import com.arcadia.premium.model.AccountPayment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class AccountEntryDto {

    private Long id;
    private String projectName;
    private Long categoryId;
    private String categoryCode;
    private String categoryName;
    private Integer serialNumber;
    private String name;
    private String itemWork;
    private BigDecimal totalInvoiced;
    private BigDecimal totalPaid;
    private BigDecimal balancePayable;
    private List<AccountInvoiceDto> invoices;
    private List<AccountPaymentDto> payments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AccountEntryDto fromEntity(AccountEntry e, List<AccountInvoice> invoices, List<AccountPayment> payments) {
        AccountEntryDto d = new AccountEntryDto();
        d.id = e.getId();
        d.projectName = e.getProjectName();
        if (e.getCategory() != null) {
            d.categoryId = e.getCategory().getId();
            d.categoryCode = e.getCategory().getCode();
            d.categoryName = e.getCategory().getName();
        }
        d.serialNumber = e.getSerialNumber();
        d.name = e.getName();
        d.itemWork = e.getItemWork();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();

        d.invoices = invoices.stream()
                .map(AccountInvoiceDto::fromEntity)
                .collect(Collectors.toList());
        d.payments = payments.stream()
                .map(AccountPaymentDto::fromEntity)
                .collect(Collectors.toList());

        d.totalInvoiced = invoices.stream()
                .map(AccountInvoice::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        d.totalPaid = payments.stream()
                .map(AccountPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        d.balancePayable = d.totalInvoiced.subtract(d.totalPaid);

        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getCategoryCode() { return categoryCode; }
    public void setCategoryCode(String categoryCode) { this.categoryCode = categoryCode; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public Integer getSerialNumber() { return serialNumber; }
    public void setSerialNumber(Integer serialNumber) { this.serialNumber = serialNumber; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getItemWork() { return itemWork; }
    public void setItemWork(String itemWork) { this.itemWork = itemWork; }

    public BigDecimal getTotalInvoiced() { return totalInvoiced; }
    public void setTotalInvoiced(BigDecimal totalInvoiced) { this.totalInvoiced = totalInvoiced; }

    public BigDecimal getTotalPaid() { return totalPaid; }
    public void setTotalPaid(BigDecimal totalPaid) { this.totalPaid = totalPaid; }

    public BigDecimal getBalancePayable() { return balancePayable; }
    public void setBalancePayable(BigDecimal balancePayable) { this.balancePayable = balancePayable; }

    public List<AccountInvoiceDto> getInvoices() { return invoices; }
    public void setInvoices(List<AccountInvoiceDto> invoices) { this.invoices = invoices; }

    public List<AccountPaymentDto> getPayments() { return payments; }
    public void setPayments(List<AccountPaymentDto> payments) { this.payments = payments; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
