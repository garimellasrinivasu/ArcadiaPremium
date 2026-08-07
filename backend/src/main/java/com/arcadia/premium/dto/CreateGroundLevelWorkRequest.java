package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateGroundLevelWorkRequest {

    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private Integer numberOfDays;
    private Integer breakdownDays;
    private Integer totalWorkingDays;

    private BigDecimal rentPerDay;
    private BigDecimal rentAmount;
    private BigDecimal driverBatthaPerDay;
    private BigDecimal batthaPaid;
    private BigDecimal otherAdvance;
    private BigDecimal totalNetPayable;

    private String billMonth;
    private String projectName;
    private String remarks;

    // Getters and Setters

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Integer getNumberOfDays() { return numberOfDays; }
    public void setNumberOfDays(Integer numberOfDays) { this.numberOfDays = numberOfDays; }

    public Integer getBreakdownDays() { return breakdownDays; }
    public void setBreakdownDays(Integer breakdownDays) { this.breakdownDays = breakdownDays; }

    public Integer getTotalWorkingDays() { return totalWorkingDays; }
    public void setTotalWorkingDays(Integer totalWorkingDays) { this.totalWorkingDays = totalWorkingDays; }

    public BigDecimal getRentPerDay() { return rentPerDay; }
    public void setRentPerDay(BigDecimal rentPerDay) { this.rentPerDay = rentPerDay; }

    public BigDecimal getRentAmount() { return rentAmount; }
    public void setRentAmount(BigDecimal rentAmount) { this.rentAmount = rentAmount; }

    public BigDecimal getDriverBatthaPerDay() { return driverBatthaPerDay; }
    public void setDriverBatthaPerDay(BigDecimal driverBatthaPerDay) { this.driverBatthaPerDay = driverBatthaPerDay; }

    public BigDecimal getBatthaPaid() { return batthaPaid; }
    public void setBatthaPaid(BigDecimal batthaPaid) { this.batthaPaid = batthaPaid; }

    public BigDecimal getOtherAdvance() { return otherAdvance; }
    public void setOtherAdvance(BigDecimal otherAdvance) { this.otherAdvance = otherAdvance; }

    public BigDecimal getTotalNetPayable() { return totalNetPayable; }
    public void setTotalNetPayable(BigDecimal totalNetPayable) { this.totalNetPayable = totalNetPayable; }

    public String getBillMonth() { return billMonth; }
    public void setBillMonth(String billMonth) { this.billMonth = billMonth; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
