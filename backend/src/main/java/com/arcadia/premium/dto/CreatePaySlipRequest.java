package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreatePaySlipRequest {

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    @NotBlank(message = "Pay month is required")
    private String payMonth;

    @NotNull(message = "Working days is required")
    private Integer workingDays;

    private LocalDate paidDate;

    private BigDecimal basic;
    private BigDecimal hra;
    private BigDecimal specialAllowances;
    private BigDecimal providentFund;
    private BigDecimal esi;
    private BigDecimal professionalTax;
    private BigDecimal tds;
    private BigDecimal advances;

    // Getters and Setters

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getPayMonth() { return payMonth; }
    public void setPayMonth(String payMonth) { this.payMonth = payMonth; }

    public Integer getWorkingDays() { return workingDays; }
    public void setWorkingDays(Integer workingDays) { this.workingDays = workingDays; }

    public LocalDate getPaidDate() { return paidDate; }
    public void setPaidDate(LocalDate paidDate) { this.paidDate = paidDate; }

    public BigDecimal getBasic() { return basic; }
    public void setBasic(BigDecimal basic) { this.basic = basic; }

    public BigDecimal getHra() { return hra; }
    public void setHra(BigDecimal hra) { this.hra = hra; }

    public BigDecimal getSpecialAllowances() { return specialAllowances; }
    public void setSpecialAllowances(BigDecimal specialAllowances) { this.specialAllowances = specialAllowances; }

    public BigDecimal getProvidentFund() { return providentFund; }
    public void setProvidentFund(BigDecimal providentFund) { this.providentFund = providentFund; }

    public BigDecimal getEsi() { return esi; }
    public void setEsi(BigDecimal esi) { this.esi = esi; }

    public BigDecimal getProfessionalTax() { return professionalTax; }
    public void setProfessionalTax(BigDecimal professionalTax) { this.professionalTax = professionalTax; }

    public BigDecimal getTds() { return tds; }
    public void setTds(BigDecimal tds) { this.tds = tds; }

    public BigDecimal getAdvances() { return advances; }
    public void setAdvances(BigDecimal advances) { this.advances = advances; }
}
