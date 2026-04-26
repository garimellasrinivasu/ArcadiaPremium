package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateSaleEntryRequest {

    @NotNull(message = "Booking date is required")
    private LocalDate bookingDate;

    @NotBlank(message = "Project is required")
    private String project;

    private String spgPraneeth;
    private String saleInitiation;
    private String tokenNumber;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String personalCompany;
    private String sol;
    private String typeOfSale;
    private BigDecimal landExtentSqYards;
    private BigDecimal sftPerSqYard;
    private BigDecimal sbuaSft;
    private String facing;
    private BigDecimal facingCharges;
    private BigDecimal basePricePerSft;
    private String amenitiesPremiums;
    private BigDecimal receivedAmount;

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

    private String remarks;

    // --- Getters & Setters ---
    public LocalDate getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDate bookingDate) { this.bookingDate = bookingDate; }
    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }
    public String getSpgPraneeth() { return spgPraneeth; }
    public void setSpgPraneeth(String spgPraneeth) { this.spgPraneeth = spgPraneeth; }
    public String getSaleInitiation() { return saleInitiation; }
    public void setSaleInitiation(String saleInitiation) { this.saleInitiation = saleInitiation; }
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
    public BigDecimal getSftPerSqYard() { return sftPerSqYard; }
    public void setSftPerSqYard(BigDecimal sftPerSqYard) { this.sftPerSqYard = sftPerSqYard; }
    public BigDecimal getSbuaSft() { return sbuaSft; }
    public void setSbuaSft(BigDecimal sbuaSft) { this.sbuaSft = sbuaSft; }
    public String getFacing() { return facing; }
    public void setFacing(String facing) { this.facing = facing; }
    public BigDecimal getFacingCharges() { return facingCharges; }
    public void setFacingCharges(BigDecimal facingCharges) { this.facingCharges = facingCharges; }
    public BigDecimal getBasePricePerSft() { return basePricePerSft; }
    public void setBasePricePerSft(BigDecimal basePricePerSft) { this.basePricePerSft = basePricePerSft; }
    public String getAmenitiesPremiums() { return amenitiesPremiums; }
    public void setAmenitiesPremiums(String amenitiesPremiums) { this.amenitiesPremiums = amenitiesPremiums; }
    public BigDecimal getReceivedAmount() { return receivedAmount; }
    public void setReceivedAmount(BigDecimal receivedAmount) { this.receivedAmount = receivedAmount; }

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

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
