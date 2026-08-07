package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ground_level_work")
public class GroundLevelWork {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_type", nullable = false)
    private String vehicleType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "number_of_days")
    private Integer numberOfDays;

    @Column(name = "breakdown_days")
    private Integer breakdownDays = 0;

    @Column(name = "total_working_days")
    private Integer totalWorkingDays;

    @Column(name = "rent_per_day", precision = 15, scale = 2)
    private BigDecimal rentPerDay;

    @Column(name = "rent_amount", precision = 15, scale = 2)
    private BigDecimal rentAmount;

    @Column(name = "driver_battha_per_day", precision = 15, scale = 2)
    private BigDecimal driverBatthaPerDay;

    @Column(name = "battha_paid", precision = 15, scale = 2)
    private BigDecimal batthaPaid;

    @Column(name = "other_advance", precision = 15, scale = 2)
    private BigDecimal otherAdvance;

    @Column(name = "total_net_payable", precision = 15, scale = 2)
    private BigDecimal totalNetPayable;

    @Column(name = "bill_month")
    private String billMonth;

    @Column(name = "project_name")
    private String projectName;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public GroundLevelWork() {}

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
