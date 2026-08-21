package com.arcadia.premium.dto;

import com.arcadia.premium.model.PaySlip;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PaySlipDto {

    private Long id;
    private String employeeId;
    private String employeeName;
    private String designation;
    private String department;
    private LocalDate dateOfJoining;
    private String panNo;
    private String payMonth;
    private Integer workingDays;
    private LocalDate paidDate;
    private BigDecimal basic;
    private BigDecimal hra;
    private BigDecimal specialAllowances;
    private BigDecimal grossSalary;
    private BigDecimal providentFund;
    private BigDecimal esi;
    private BigDecimal professionalTax;
    private BigDecimal tds;
    private BigDecimal advances;
    private BigDecimal totalDeductions;
    private BigDecimal netSalary;
    private String netSalaryInWords;
    private String status;
    private LocalDateTime sentAt;
    private String sentTo;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PaySlipDto fromEntity(PaySlip e) {
        PaySlipDto dto = new PaySlipDto();
        dto.id = e.getId();
        dto.employeeId = e.getEmployeeId();
        dto.employeeName = e.getEmployeeName();
        dto.designation = e.getDesignation();
        dto.department = e.getDepartment();
        dto.dateOfJoining = e.getDateOfJoining();
        dto.panNo = e.getPanNo();
        dto.payMonth = e.getPayMonth();
        dto.workingDays = e.getWorkingDays();
        dto.paidDate = e.getPaidDate();
        dto.basic = e.getBasic();
        dto.hra = e.getHra();
        dto.specialAllowances = e.getSpecialAllowances();
        dto.grossSalary = e.getGrossSalary();
        dto.providentFund = e.getProvidentFund();
        dto.esi = e.getEsi();
        dto.professionalTax = e.getProfessionalTax();
        dto.tds = e.getTds();
        dto.advances = e.getAdvances();
        dto.totalDeductions = e.getTotalDeductions();
        dto.netSalary = e.getNetSalary();
        dto.netSalaryInWords = e.getNetSalaryInWords();
        dto.status = e.getStatus();
        dto.sentAt = e.getSentAt();
        dto.sentTo = e.getSentTo();
        dto.createdBy = e.getCreatedBy();
        dto.createdAt = e.getCreatedAt();
        dto.updatedAt = e.getUpdatedAt();
        return dto;
    }

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public LocalDate getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; }

    public String getPanNo() { return panNo; }
    public void setPanNo(String panNo) { this.panNo = panNo; }

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

    public BigDecimal getGrossSalary() { return grossSalary; }
    public void setGrossSalary(BigDecimal grossSalary) { this.grossSalary = grossSalary; }

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

    public BigDecimal getTotalDeductions() { return totalDeductions; }
    public void setTotalDeductions(BigDecimal totalDeductions) { this.totalDeductions = totalDeductions; }

    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }

    public String getNetSalaryInWords() { return netSalaryInWords; }
    public void setNetSalaryInWords(String netSalaryInWords) { this.netSalaryInWords = netSalaryInWords; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public String getSentTo() { return sentTo; }
    public void setSentTo(String sentTo) { this.sentTo = sentTo; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
