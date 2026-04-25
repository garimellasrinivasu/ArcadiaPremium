package com.arcadia.premium.dto;

import com.arcadia.premium.model.SaleEntry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class SaleEntryDto {

    private Long id;
    private Integer serialNo;
    private LocalDate bookingDate;
    private String project;
    private String spgPraneeth;
    private String tokenNumber;
    private String customerName;
    private String personalCompany;
    private String sol;
    private String typeOfSale;
    private BigDecimal landExtentSqYards;
    private BigDecimal sbuaSft;
    private String facing;
    private BigDecimal basePricePerSft;
    private String amenitiesPremiums;
    private BigDecimal totalSalesConsideration;
    private BigDecimal receivedAmount;
    private BigDecimal balanceToReceive;
    private BigDecimal balancePlanApproved;
    private BigDecimal balanceDuringExecution;

    // Additional charges
    private Boolean includeClubHouse;
    private BigDecimal clubHouseCharges;
    private Boolean includeCorpusFund;
    private BigDecimal corpusFund;
    private Boolean includeLegalDoc;
    private BigDecimal legalDocCharges;
    private Boolean includeCautionDeposit;
    private BigDecimal refundableCautionDeposit;
    private Boolean includeAdvanceMaintenance;
    private BigDecimal advanceMaintRatePerSft;
    private Integer advanceMaintMonths;
    private BigDecimal advanceMaintenanceTotal;
    private BigDecimal totalAdditionalCharges;
    private BigDecimal grandTotal;

    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SaleEntryDto fromEntity(SaleEntry e) {
        SaleEntryDto dto = new SaleEntryDto();
        dto.id = e.getId();
        dto.serialNo = e.getSerialNo();
        dto.bookingDate = e.getBookingDate();
        dto.project = e.getProject();
        dto.spgPraneeth = e.getSpgPraneeth();
        dto.tokenNumber = e.getTokenNumber();
        dto.customerName = e.getCustomerName();
        dto.personalCompany = e.getPersonalCompany();
        dto.sol = e.getSol();
        dto.typeOfSale = e.getTypeOfSale();
        dto.landExtentSqYards = e.getLandExtentSqYards();
        dto.sbuaSft = e.getSbuaSft();
        dto.facing = e.getFacing();
        dto.basePricePerSft = e.getBasePricePerSft();
        dto.amenitiesPremiums = e.getAmenitiesPremiums();
        dto.totalSalesConsideration = e.getTotalSalesConsideration();
        dto.receivedAmount = e.getReceivedAmount();
        dto.balanceToReceive = e.getBalanceToReceive();
        dto.balancePlanApproved = e.getBalancePlanApproved();
        dto.balanceDuringExecution = e.getBalanceDuringExecution();
        // Additional charges
        dto.includeClubHouse = e.getIncludeClubHouse();
        dto.clubHouseCharges = e.getClubHouseCharges();
        dto.includeCorpusFund = e.getIncludeCorpusFund();
        dto.corpusFund = e.getCorpusFund();
        dto.includeLegalDoc = e.getIncludeLegalDoc();
        dto.legalDocCharges = e.getLegalDocCharges();
        dto.includeCautionDeposit = e.getIncludeCautionDeposit();
        dto.refundableCautionDeposit = e.getRefundableCautionDeposit();
        dto.includeAdvanceMaintenance = e.getIncludeAdvanceMaintenance();
        dto.advanceMaintRatePerSft = e.getAdvanceMaintRatePerSft();
        dto.advanceMaintMonths = e.getAdvanceMaintMonths();
        dto.advanceMaintenanceTotal = e.getAdvanceMaintenanceTotal();
        dto.totalAdditionalCharges = e.getTotalAdditionalCharges();
        dto.grandTotal = e.getGrandTotal();
        dto.remarks = e.getRemarks();
        dto.createdAt = e.getCreatedAt();
        dto.updatedAt = e.getUpdatedAt();
        return dto;
    }

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
