package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sale_entries")
public class SaleEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "serial_no")
    private Integer serialNo;

    @Column(name = "booking_date")
    private LocalDate bookingDate;

    @Column(name = "project")
    private String project;

    @Column(name = "spg_praneeth")
    private String spgPraneeth;

    @Column(name = "token_number")
    private String tokenNumber;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "personal_company")
    private String personalCompany;

    @Column(name = "sol")
    private String sol;

    @Column(name = "type_of_sale")
    private String typeOfSale;

    @Column(name = "land_extent_sqyards", precision = 12, scale = 2)
    private BigDecimal landExtentSqYards;

    @Column(name = "sbua_sft", precision = 12, scale = 2)
    private BigDecimal sbuaSft;

    @Column(name = "facing")
    private String facing;

    @Column(name = "base_price_per_sft", precision = 12, scale = 2)
    private BigDecimal basePricePerSft;

    @Column(name = "amenities_premiums", length = 500)
    private String amenitiesPremiums;

    @Column(name = "total_sales_consideration", precision = 15, scale = 2)
    private BigDecimal totalSalesConsideration;

    @Column(name = "received_amount", precision = 15, scale = 2)
    private BigDecimal receivedAmount;

    @Column(name = "balance_to_receive", precision = 15, scale = 2)
    private BigDecimal balanceToReceive;

    @Column(name = "balance_plan_approved", precision = 15, scale = 2)
    private BigDecimal balancePlanApproved;

    @Column(name = "balance_during_execution", precision = 15, scale = 2)
    private BigDecimal balanceDuringExecution;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public SaleEntry() {}

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getSerialNo() { return serialNo; }
    public void setSerialNo(Integer serialNo) { this.serialNo = serialNo; }

    public LocalDate getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDate bookingDate) { this.bookingDate = bookingDate; }

    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }

    public String getSpgPraneeth() { return spgPraneeth; }
    public void setSpgPraneeth(String spgPraneeth) { this.spgPraneeth = spgPraneeth; }

    public String getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getPersonalCompany() { return personalCompany; }
    public void setPersonalCompany(String personalCompany) { this.personalCompany = personalCompany; }

    public String getSol() { return sol; }
    public void setSol(String sol) { this.sol = sol; }

    public String getTypeOfSale() { return typeOfSale; }
    public void setTypeOfSale(String typeOfSale) { this.typeOfSale = typeOfSale; }

    public BigDecimal getLandExtentSqYards() { return landExtentSqYards; }
    public void setLandExtentSqYards(BigDecimal landExtentSqYards) { this.landExtentSqYards = landExtentSqYards; }

    public BigDecimal getSbuaSft() { return sbuaSft; }
    public void setSbuaSft(BigDecimal sbuaSft) { this.sbuaSft = sbuaSft; }

    public String getFacing() { return facing; }
    public void setFacing(String facing) { this.facing = facing; }

    public BigDecimal getBasePricePerSft() { return basePricePerSft; }
    public void setBasePricePerSft(BigDecimal basePricePerSft) { this.basePricePerSft = basePricePerSft; }

    public String getAmenitiesPremiums() { return amenitiesPremiums; }
    public void setAmenitiesPremiums(String amenitiesPremiums) { this.amenitiesPremiums = amenitiesPremiums; }

    public BigDecimal getTotalSalesConsideration() { return totalSalesConsideration; }
    public void setTotalSalesConsideration(BigDecimal totalSalesConsideration) { this.totalSalesConsideration = totalSalesConsideration; }

    public BigDecimal getReceivedAmount() { return receivedAmount; }
    public void setReceivedAmount(BigDecimal receivedAmount) { this.receivedAmount = receivedAmount; }

    public BigDecimal getBalanceToReceive() { return balanceToReceive; }
    public void setBalanceToReceive(BigDecimal balanceToReceive) { this.balanceToReceive = balanceToReceive; }

    public BigDecimal getBalancePlanApproved() { return balancePlanApproved; }
    public void setBalancePlanApproved(BigDecimal balancePlanApproved) { this.balancePlanApproved = balancePlanApproved; }

    public BigDecimal getBalanceDuringExecution() { return balanceDuringExecution; }
    public void setBalanceDuringExecution(BigDecimal balanceDuringExecution) { this.balanceDuringExecution = balanceDuringExecution; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
