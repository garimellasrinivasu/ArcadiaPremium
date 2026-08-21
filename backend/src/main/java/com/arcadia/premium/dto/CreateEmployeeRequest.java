package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateEmployeeRequest {

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    @NotBlank(message = "Name is required")
    private String name;

    private String designation;
    private String department;
    private LocalDate dateOfJoining;
    private String panNo;
    private String email;
    private String phone;
    private BigDecimal basicSalary;
    private BigDecimal hra;
    private BigDecimal specialAllowances;
    private BigDecimal pfPercentage;
    private BigDecimal esiPercentage;
    private BigDecimal professionalTax;
    private boolean active = true;

    // Getters and Setters

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public LocalDate getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; }

    public String getPanNo() { return panNo; }
    public void setPanNo(String panNo) { this.panNo = panNo; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public BigDecimal getBasicSalary() { return basicSalary; }
    public void setBasicSalary(BigDecimal basicSalary) { this.basicSalary = basicSalary; }

    public BigDecimal getHra() { return hra; }
    public void setHra(BigDecimal hra) { this.hra = hra; }

    public BigDecimal getSpecialAllowances() { return specialAllowances; }
    public void setSpecialAllowances(BigDecimal specialAllowances) { this.specialAllowances = specialAllowances; }

    public BigDecimal getPfPercentage() { return pfPercentage; }
    public void setPfPercentage(BigDecimal pfPercentage) { this.pfPercentage = pfPercentage; }

    public BigDecimal getEsiPercentage() { return esiPercentage; }
    public void setEsiPercentage(BigDecimal esiPercentage) { this.esiPercentage = esiPercentage; }

    public BigDecimal getProfessionalTax() { return professionalTax; }
    public void setProfessionalTax(BigDecimal professionalTax) { this.professionalTax = professionalTax; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
