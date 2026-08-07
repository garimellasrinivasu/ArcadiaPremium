package com.arcadia.premium.dto;

import com.arcadia.premium.model.GroundLevelWork;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class GroundLevelWorkDto {

    private Long id;
    private String vehicleType;
    private LocalDate startDate;
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
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GroundLevelWorkDto fromEntity(GroundLevelWork e) {
        GroundLevelWorkDto dto = new GroundLevelWorkDto();
        dto.id = e.getId();
        dto.vehicleType = e.getVehicleType();
        dto.startDate = e.getStartDate();
        dto.endDate = e.getEndDate();
        dto.numberOfDays = e.getNumberOfDays();
        dto.breakdownDays = e.getBreakdownDays();
        dto.totalWorkingDays = e.getTotalWorkingDays();
        dto.rentPerDay = e.getRentPerDay();
        dto.rentAmount = e.getRentAmount();
        dto.driverBatthaPerDay = e.getDriverBatthaPerDay();
        dto.batthaPaid = e.getBatthaPaid();
        dto.otherAdvance = e.getOtherAdvance();
        dto.totalNetPayable = e.getTotalNetPayable();
        dto.billMonth = e.getBillMonth();
        dto.projectName = e.getProjectName();
        dto.remarks = e.getRemarks();
        dto.createdBy = e.getCreatedBy();
        dto.createdAt = e.getCreatedAt();
        dto.updatedAt = e.getUpdatedAt();
        return dto;
    }

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
