package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pay_slip")
public class PaySlip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private String employeeId;

    @Column(name = "employee_name", nullable = false)
    private String employeeName;

    @Column(name = "designation")
    private String designation;

    @Column(name = "department")
    private String department;

    @Column(name = "date_of_joining")
    private LocalDate dateOfJoining;

    @Column(name = "pan_no")
    private String panNo;

    @Column(name = "pay_month", nullable = false)
    private String payMonth;

    @Column(name = "working_days")
    private Integer workingDays;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    // Earnings
    @Column(name = "basic", precision = 15, scale = 2)
    private BigDecimal basic;

    @Column(name = "hra", precision = 15, scale = 2)
    private BigDecimal hra;

    @Column(name = "special_allowances", precision = 15, scale = 2)
    private BigDecimal specialAllowances;

    @Column(name = "gross_salary", precision = 15, scale = 2)
    private BigDecimal grossSalary;

    // Deductions
    @Column(name = "provident_fund", precision = 15, scale = 2)
    private BigDecimal providentFund;

    @Column(name = "esi", precision = 15, scale = 2)
    private BigDecimal esi;

    @Column(name = "professional_tax", precision = 15, scale = 2)
    private BigDecimal professionalTax;

    @Column(name = "tds", precision = 15, scale = 2)
    private BigDecimal tds;

    @Column(name = "advances", precision = 15, scale = 2)
    private BigDecimal advances;

    @Column(name = "total_deductions", precision = 15, scale = 2)
    private BigDecimal totalDeductions;

    // Net
    @Column(name = "net_salary", precision = 15, scale = 2)
    private BigDecimal netSalary;

    @Column(name = "net_salary_in_words")
    private String netSalaryInWords;

    @Column(name = "status")
    private String status = "DRAFT";

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "sent_to")
    private String sentTo;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public PaySlip() {}

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
