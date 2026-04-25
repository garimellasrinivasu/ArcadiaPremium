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

    // --- Additional Charges (selectable during sale finalization) ---

    @Column(name = "include_club_house")
    private Boolean includeClubHouse = false;

    @Column(name = "club_house_charges", precision = 12, scale = 2)
    private BigDecimal clubHouseCharges;

    @Column(name = "include_corpus_fund")
    private Boolean includeCorpusFund = false;

    @Column(name = "corpus_fund", precision = 12, scale = 2)
    private BigDecimal corpusFund;

    @Column(name = "include_legal_doc")
    private Boolean includeLegalDoc = false;

    @Column(name = "legal_doc_charges", precision = 12, scale = 2)
    private BigDecimal legalDocCharges;

    @Column(name = "include_caution_deposit")
    private Boolean includeCautionDeposit = false;

    @Column(name = "refundable_caution_deposit", precision = 12, scale = 2)
    private BigDecimal refundableCautionDeposit;

    @Column(name = "include_advance_maintenance")
    private Boolean includeAdvanceMaintenance = false;

    @Column(name = "advance_maint_rate_per_sft", precision = 8, scale = 2)
    private BigDecimal advanceMaintRatePerSft;

    @Column(name = "advance_maint_months")
    private Integer advanceMaintMonths;

    @Column(name = "advance_maintenance_total", precision = 12, scale = 2)
    private BigDecimal advanceMaintenanceTotal;

    @Column(name = "total_additional_charges", precision = 15, scale = 2)
    private BigDecimal totalAdditionalCharges;

    @Column(name = "grand_total", precision = 15, scale = 2)
    private BigDecimal grandTotal;

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

    public Boolean getIncludeClubHouse() { return includeClubHouse; }
    public void setIncludeClubHouse(Boolean includeClubHouse) { this.includeClubHouse = includeClubHouse; }
    public BigDecimal getClubHouseCharges() { return clubHouseCharges; }
    public void setClubHouseCharges(BigDecimal clubHouseCharges) { this.clubHouseCharges = clubHouseCharges; }

    public Boolean getIncludeCorpusFund() { return includeCorpusFund; }
    public void setIncludeCorpusFund(Boolean includeCorpusFund) { this.includeCorpusFund = includeCorpusFund; }
    public BigDecimal getCorpusFund() { return corpusFund; }
    public void setCorpusFund(BigDecimal corpusFund) { this.corpusFund = corpusFund; }

    public Boolean getIncludeLegalDoc() { return includeLegalDoc; }
    public void setIncludeLegalDoc(Boolean includeLegalDoc) { this.includeLegalDoc = includeLegalDoc; }
    public BigDecimal getLegalDocCharges() { return legalDocCharges; }
    public void setLegalDocCharges(BigDecimal legalDocCharges) { this.legalDocCharges = legalDocCharges; }

    public Boolean getIncludeCautionDeposit() { return includeCautionDeposit; }
    public void setIncludeCautionDeposit(Boolean includeCautionDeposit) { this.includeCautionDeposit = includeCautionDeposit; }
    public BigDecimal getRefundableCautionDeposit() { return refundableCautionDeposit; }
    public void setRefundableCautionDeposit(BigDecimal refundableCautionDeposit) { this.refundableCautionDeposit = refundableCautionDeposit; }

    public Boolean getIncludeAdvanceMaintenance() { return includeAdvanceMaintenance; }
    public void setIncludeAdvanceMaintenance(Boolean includeAdvanceMaintenance) { this.includeAdvanceMaintenance = includeAdvanceMaintenance; }
    public BigDecimal getAdvanceMaintRatePerSft() { return advanceMaintRatePerSft; }
    public void setAdvanceMaintRatePerSft(BigDecimal advanceMaintRatePerSft) { this.advanceMaintRatePerSft = advanceMaintRatePerSft; }
    public Integer getAdvanceMaintMonths() { return advanceMaintMonths; }
    public void setAdvanceMaintMonths(Integer advanceMaintMonths) { this.advanceMaintMonths = advanceMaintMonths; }
    public BigDecimal getAdvanceMaintenanceTotal() { return advanceMaintenanceTotal; }
    public void setAdvanceMaintenanceTotal(BigDecimal advanceMaintenanceTotal) { this.advanceMaintenanceTotal = advanceMaintenanceTotal; }

    public BigDecimal getTotalAdditionalCharges() { return totalAdditionalCharges; }
    public void setTotalAdditionalCharges(BigDecimal totalAdditionalCharges) { this.totalAdditionalCharges = totalAdditionalCharges; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
