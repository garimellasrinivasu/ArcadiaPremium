package com.arcadia.premium.dto;

import com.arcadia.premium.model.SaleEntry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class SaleEntryDto {

    private Long id;
    private Integer serialNo;
    private LocalDate bookingDate;
    private String project;
    private String spgPraneeth;
    private String saleInitiation;
    private String tokenNumber;
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
    // Payments
    private List<PaymentEntryDto> payments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SaleEntryDto fromEntity(SaleEntry e) {
        SaleEntryDto dto = new SaleEntryDto();
        dto.id = e.getId();
        dto.serialNo = e.getSerialNo();
        dto.bookingDate = e.getBookingDate();
        dto.project = e.getProject();
        dto.spgPraneeth = e.getSpgPraneeth();
        dto.saleInitiation = e.getSaleInitiation();
        dto.tokenNumber = e.getTokenNumber();
        dto.customerName = e.getCustomerName();
        dto.personalCompany = e.getPersonalCompany();
        dto.sol = e.getSol();
        dto.typeOfSale = e.getTypeOfSale();
        dto.landExtentSqYards = e.getLandExtentSqYards();
        dto.sftPerSqYard = e.getSftPerSqYard();
        dto.sbuaSft = e.getSbuaSft();
        dto.facing = e.getFacing();
        dto.facingCharges = e.getFacingCharges();
        dto.basePricePerSft = e.getBasePricePerSft();
        dto.amenitiesPremiums = e.getAmenitiesPremiums();
        dto.totalSalesConsideration = e.getTotalSalesConsideration();
        dto.receivedAmount = e.getReceivedAmount();
        dto.balanceToReceive = e.getBalanceToReceive();
        dto.balancePlanApproved = e.getBalancePlanApproved();
        dto.balanceDuringExecution = e.getBalanceDuringExecution();
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
        try {
            dto.payments = e.getPayments().stream()
                    .map(PaymentEntryDto::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception ex) {
            dto.payments = List.of();
        }
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
    public void setIncludeClubHouse(Boolean v) { this.includeClubHouse = v; }
    public BigDecimal getClubHouseCharges() { return clubHouseCharges; }
    public void setClubHouseCharges(BigDecimal v) { this.clubHouseCharges = v; }
    public Boolean getIncludeCorpusFund() { return includeCorpusFund; }
    public void setIncludeCorpusFund(Boolean v) { this.includeCorpusFund = v; }
    public BigDecimal getCorpusFund() { return corpusFund; }
    public void setCorpusFund(BigDecimal v) { this.corpusFund = v; }
    public Boolean getIncludeLegalDoc() { return includeLegalDoc; }
    public void setIncludeLegalDoc(Boolean v) { this.includeLegalDoc = v; }
    public BigDecimal getLegalDocCharges() { return legalDocCharges; }
    public void setLegalDocCharges(BigDecimal v) { this.legalDocCharges = v; }
    public Boolean getIncludeCautionDeposit() { return includeCautionDeposit; }
    public void setIncludeCautionDeposit(Boolean v) { this.includeCautionDeposit = v; }
    public BigDecimal getRefundableCautionDeposit() { return refundableCautionDeposit; }
    public void setRefundableCautionDeposit(BigDecimal v) { this.refundableCautionDeposit = v; }
    public Boolean getIncludeAdvanceMaintenance() { return includeAdvanceMaintenance; }
    public void setIncludeAdvanceMaintenance(Boolean v) { this.includeAdvanceMaintenance = v; }
    public BigDecimal getAdvanceMaintRatePerSft() { return advanceMaintRatePerSft; }
    public void setAdvanceMaintRatePerSft(BigDecimal v) { this.advanceMaintRatePerSft = v; }
    public Integer getAdvanceMaintMonths() { return advanceMaintMonths; }
    public void setAdvanceMaintMonths(Integer v) { this.advanceMaintMonths = v; }
    public BigDecimal getAdvanceMaintenanceTotal() { return advanceMaintenanceTotal; }
    public void setAdvanceMaintenanceTotal(BigDecimal v) { this.advanceMaintenanceTotal = v; }
    public BigDecimal getTotalAdditionalCharges() { return totalAdditionalCharges; }
    public void setTotalAdditionalCharges(BigDecimal v) { this.totalAdditionalCharges = v; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal v) { this.grandTotal = v; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<PaymentEntryDto> getPayments() { return payments; }
    public void setPayments(List<PaymentEntryDto> payments) { this.payments = payments; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
