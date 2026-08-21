package com.arcadia.premium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public class AccountSummaryDto {

    private String periodLabel;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal totalInvoiced;
    private BigDecimal totalPaid;
    private BigDecimal balancePayable;
    private Map<String, BigDecimal> categoryBreakdown;

    public AccountSummaryDto() {}

    public String getPeriodLabel() { return periodLabel; }
    public void setPeriodLabel(String periodLabel) { this.periodLabel = periodLabel; }

    public LocalDate getPeriodStart() { return periodStart; }
    public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }

    public LocalDate getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }

    public BigDecimal getTotalInvoiced() { return totalInvoiced; }
    public void setTotalInvoiced(BigDecimal totalInvoiced) { this.totalInvoiced = totalInvoiced; }

    public BigDecimal getTotalPaid() { return totalPaid; }
    public void setTotalPaid(BigDecimal totalPaid) { this.totalPaid = totalPaid; }

    public BigDecimal getBalancePayable() { return balancePayable; }
    public void setBalancePayable(BigDecimal balancePayable) { this.balancePayable = balancePayable; }

    public Map<String, BigDecimal> getCategoryBreakdown() { return categoryBreakdown; }
    public void setCategoryBreakdown(Map<String, BigDecimal> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }
}
