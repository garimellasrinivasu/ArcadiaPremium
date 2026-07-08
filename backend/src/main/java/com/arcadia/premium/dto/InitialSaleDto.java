package com.arcadia.premium.dto;

import com.arcadia.premium.model.InitialSale;
import java.time.LocalDateTime;

public class InitialSaleDto {

    private Long id;
    private String customerName;
    private Integer sqYardsVilla;
    private String villaNumber;
    private String saleMode;
    private String projectName;
    private Double sftPerSqYard;
    private Double salePricePerSft;
    private String defaultFacing;
    private Double facingCharges;
    private Integer extraLandSqYards;
    private Double extraLandPricePerSqYard;
    private Double paymentTillNow;
    private Integer totalSftPerVilla;
    private Double totalSftPrice;
    private Double extraLandTotal;
    private Double basePriceAmount;
    private Double balanceInBasePrice;
    private Double newSftPerSqYard;
    private Double newSalePricePerSft;
    private String newDefaultFacing;
    private Double newFacingCharges;
    private Integer newExtraLandSqYards;
    private Double newExtraLandPricePerSqYard;
    private Double newPaymentTillNow;
    private Integer newTotalSftPerVilla;
    private Double newTotalSftPrice;
    private Double newExtraLandTotal;
    private Double newBasePriceAmount;
    private Double newBalanceInBasePrice;
    private Boolean clubHouseApplicable;
    private Double clubHouseAmount;
    private Boolean corpusFundApplicable;
    private Double corpusFundAmount;
    private Boolean legalChargesApplicable;
    private Double legalChargesAmount;
    private Boolean cautionDepositApplicable;
    private Double cautionDepositAmount;
    private Boolean advanceMaintenanceApplicable;
    private Double advanceMaintenanceRate;
    private Integer advanceMaintenanceMonths;
    private Double advanceMaintenanceAmount;
    private Double newAdvanceMaintenanceAmount;
    private Boolean registrationPaymentApplicable;
    private Double gstPercentage;
    private Double gstAmount;
    private Double newGstAmount;
    private Double stampDutyPercentage;
    private Double stampDutyAmount;
    private Double newStampDutyAmount;
    private String salePriceRowsJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public Integer getSqYardsVilla() { return sqYardsVilla; }
    public void setSqYardsVilla(Integer sqYardsVilla) { this.sqYardsVilla = sqYardsVilla; }

    public String getVillaNumber() { return villaNumber; }
    public void setVillaNumber(String villaNumber) { this.villaNumber = villaNumber; }

    public String getSaleMode() { return saleMode; }
    public void setSaleMode(String saleMode) { this.saleMode = saleMode; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public Double getSftPerSqYard() { return sftPerSqYard; }
    public void setSftPerSqYard(Double sftPerSqYard) { this.sftPerSqYard = sftPerSqYard; }

    public Double getSalePricePerSft() { return salePricePerSft; }
    public void setSalePricePerSft(Double salePricePerSft) { this.salePricePerSft = salePricePerSft; }

    public String getDefaultFacing() { return defaultFacing; }
    public void setDefaultFacing(String defaultFacing) { this.defaultFacing = defaultFacing; }

    public Double getFacingCharges() { return facingCharges; }
    public void setFacingCharges(Double facingCharges) { this.facingCharges = facingCharges; }

    public Integer getExtraLandSqYards() { return extraLandSqYards; }
    public void setExtraLandSqYards(Integer extraLandSqYards) { this.extraLandSqYards = extraLandSqYards; }

    public Double getExtraLandPricePerSqYard() { return extraLandPricePerSqYard; }
    public void setExtraLandPricePerSqYard(Double extraLandPricePerSqYard) { this.extraLandPricePerSqYard = extraLandPricePerSqYard; }

    public Double getPaymentTillNow() { return paymentTillNow; }
    public void setPaymentTillNow(Double paymentTillNow) { this.paymentTillNow = paymentTillNow; }

    public Integer getTotalSftPerVilla() { return totalSftPerVilla; }
    public void setTotalSftPerVilla(Integer totalSftPerVilla) { this.totalSftPerVilla = totalSftPerVilla; }

    public Double getTotalSftPrice() { return totalSftPrice; }
    public void setTotalSftPrice(Double totalSftPrice) { this.totalSftPrice = totalSftPrice; }

    public Double getExtraLandTotal() { return extraLandTotal; }
    public void setExtraLandTotal(Double extraLandTotal) { this.extraLandTotal = extraLandTotal; }

    public Double getBasePriceAmount() { return basePriceAmount; }
    public void setBasePriceAmount(Double basePriceAmount) { this.basePriceAmount = basePriceAmount; }

    public Double getBalanceInBasePrice() { return balanceInBasePrice; }
    public void setBalanceInBasePrice(Double balanceInBasePrice) { this.balanceInBasePrice = balanceInBasePrice; }

    public Double getNewSftPerSqYard() { return newSftPerSqYard; }
    public void setNewSftPerSqYard(Double newSftPerSqYard) { this.newSftPerSqYard = newSftPerSqYard; }

    public Double getNewSalePricePerSft() { return newSalePricePerSft; }
    public void setNewSalePricePerSft(Double newSalePricePerSft) { this.newSalePricePerSft = newSalePricePerSft; }

    public String getNewDefaultFacing() { return newDefaultFacing; }
    public void setNewDefaultFacing(String newDefaultFacing) { this.newDefaultFacing = newDefaultFacing; }

    public Double getNewFacingCharges() { return newFacingCharges; }
    public void setNewFacingCharges(Double newFacingCharges) { this.newFacingCharges = newFacingCharges; }

    public Integer getNewExtraLandSqYards() { return newExtraLandSqYards; }
    public void setNewExtraLandSqYards(Integer newExtraLandSqYards) { this.newExtraLandSqYards = newExtraLandSqYards; }

    public Double getNewExtraLandPricePerSqYard() { return newExtraLandPricePerSqYard; }
    public void setNewExtraLandPricePerSqYard(Double newExtraLandPricePerSqYard) { this.newExtraLandPricePerSqYard = newExtraLandPricePerSqYard; }

    public Double getNewPaymentTillNow() { return newPaymentTillNow; }
    public void setNewPaymentTillNow(Double newPaymentTillNow) { this.newPaymentTillNow = newPaymentTillNow; }

    public Integer getNewTotalSftPerVilla() { return newTotalSftPerVilla; }
    public void setNewTotalSftPerVilla(Integer newTotalSftPerVilla) { this.newTotalSftPerVilla = newTotalSftPerVilla; }

    public Double getNewTotalSftPrice() { return newTotalSftPrice; }
    public void setNewTotalSftPrice(Double newTotalSftPrice) { this.newTotalSftPrice = newTotalSftPrice; }

    public Double getNewExtraLandTotal() { return newExtraLandTotal; }
    public void setNewExtraLandTotal(Double newExtraLandTotal) { this.newExtraLandTotal = newExtraLandTotal; }

    public Double getNewBasePriceAmount() { return newBasePriceAmount; }
    public void setNewBasePriceAmount(Double newBasePriceAmount) { this.newBasePriceAmount = newBasePriceAmount; }

    public Double getNewBalanceInBasePrice() { return newBalanceInBasePrice; }
    public void setNewBalanceInBasePrice(Double newBalanceInBasePrice) { this.newBalanceInBasePrice = newBalanceInBasePrice; }

    public Boolean getClubHouseApplicable() { return clubHouseApplicable; }
    public void setClubHouseApplicable(Boolean clubHouseApplicable) { this.clubHouseApplicable = clubHouseApplicable; }

    public Double getClubHouseAmount() { return clubHouseAmount; }
    public void setClubHouseAmount(Double clubHouseAmount) { this.clubHouseAmount = clubHouseAmount; }

    public Boolean getCorpusFundApplicable() { return corpusFundApplicable; }
    public void setCorpusFundApplicable(Boolean corpusFundApplicable) { this.corpusFundApplicable = corpusFundApplicable; }

    public Double getCorpusFundAmount() { return corpusFundAmount; }
    public void setCorpusFundAmount(Double corpusFundAmount) { this.corpusFundAmount = corpusFundAmount; }

    public Boolean getLegalChargesApplicable() { return legalChargesApplicable; }
    public void setLegalChargesApplicable(Boolean legalChargesApplicable) { this.legalChargesApplicable = legalChargesApplicable; }

    public Double getLegalChargesAmount() { return legalChargesAmount; }
    public void setLegalChargesAmount(Double legalChargesAmount) { this.legalChargesAmount = legalChargesAmount; }

    public Boolean getCautionDepositApplicable() { return cautionDepositApplicable; }
    public void setCautionDepositApplicable(Boolean cautionDepositApplicable) { this.cautionDepositApplicable = cautionDepositApplicable; }

    public Double getCautionDepositAmount() { return cautionDepositAmount; }
    public void setCautionDepositAmount(Double cautionDepositAmount) { this.cautionDepositAmount = cautionDepositAmount; }

    public Boolean getAdvanceMaintenanceApplicable() { return advanceMaintenanceApplicable; }
    public void setAdvanceMaintenanceApplicable(Boolean advanceMaintenanceApplicable) { this.advanceMaintenanceApplicable = advanceMaintenanceApplicable; }

    public Double getAdvanceMaintenanceRate() { return advanceMaintenanceRate; }
    public void setAdvanceMaintenanceRate(Double advanceMaintenanceRate) { this.advanceMaintenanceRate = advanceMaintenanceRate; }

    public Integer getAdvanceMaintenanceMonths() { return advanceMaintenanceMonths; }
    public void setAdvanceMaintenanceMonths(Integer advanceMaintenanceMonths) { this.advanceMaintenanceMonths = advanceMaintenanceMonths; }

    public Double getAdvanceMaintenanceAmount() { return advanceMaintenanceAmount; }
    public void setAdvanceMaintenanceAmount(Double advanceMaintenanceAmount) { this.advanceMaintenanceAmount = advanceMaintenanceAmount; }

    public Double getNewAdvanceMaintenanceAmount() { return newAdvanceMaintenanceAmount; }
    public void setNewAdvanceMaintenanceAmount(Double newAdvanceMaintenanceAmount) { this.newAdvanceMaintenanceAmount = newAdvanceMaintenanceAmount; }

    public Boolean getRegistrationPaymentApplicable() { return registrationPaymentApplicable; }
    public void setRegistrationPaymentApplicable(Boolean registrationPaymentApplicable) { this.registrationPaymentApplicable = registrationPaymentApplicable; }

    public Double getGstPercentage() { return gstPercentage; }
    public void setGstPercentage(Double gstPercentage) { this.gstPercentage = gstPercentage; }

    public Double getGstAmount() { return gstAmount; }
    public void setGstAmount(Double gstAmount) { this.gstAmount = gstAmount; }

    public Double getNewGstAmount() { return newGstAmount; }
    public void setNewGstAmount(Double newGstAmount) { this.newGstAmount = newGstAmount; }

    public Double getStampDutyPercentage() { return stampDutyPercentage; }
    public void setStampDutyPercentage(Double stampDutyPercentage) { this.stampDutyPercentage = stampDutyPercentage; }

    public Double getStampDutyAmount() { return stampDutyAmount; }
    public void setStampDutyAmount(Double stampDutyAmount) { this.stampDutyAmount = stampDutyAmount; }

    public Double getNewStampDutyAmount() { return newStampDutyAmount; }
    public void setNewStampDutyAmount(Double newStampDutyAmount) { this.newStampDutyAmount = newStampDutyAmount; }

    public String getSalePriceRowsJson() { return salePriceRowsJson; }
    public void setSalePriceRowsJson(String salePriceRowsJson) { this.salePriceRowsJson = salePriceRowsJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static InitialSaleDto fromEntity(InitialSale entity) {
        InitialSaleDto dto = new InitialSaleDto();
        dto.id = entity.getId();
        dto.customerName = entity.getCustomerName();
        dto.sqYardsVilla = entity.getSqYardsVilla();
        dto.villaNumber = entity.getVillaNumber();
        dto.saleMode = entity.getSaleMode();
        dto.projectName = entity.getProjectName();
        dto.sftPerSqYard = entity.getSftPerSqYard();
        dto.salePricePerSft = entity.getSalePricePerSft();
        dto.defaultFacing = entity.getDefaultFacing();
        dto.facingCharges = entity.getFacingCharges();
        dto.extraLandSqYards = entity.getExtraLandSqYards();
        dto.extraLandPricePerSqYard = entity.getExtraLandPricePerSqYard();
        dto.paymentTillNow = entity.getPaymentTillNow();
        dto.totalSftPerVilla = entity.getTotalSftPerVilla();
        dto.totalSftPrice = entity.getTotalSftPrice();
        dto.extraLandTotal = entity.getExtraLandTotal();
        dto.basePriceAmount = entity.getBasePriceAmount();
        dto.balanceInBasePrice = entity.getBalanceInBasePrice();
        dto.newSftPerSqYard = entity.getNewSftPerSqYard();
        dto.newSalePricePerSft = entity.getNewSalePricePerSft();
        dto.newDefaultFacing = entity.getNewDefaultFacing();
        dto.newFacingCharges = entity.getNewFacingCharges();
        dto.newExtraLandSqYards = entity.getNewExtraLandSqYards();
        dto.newExtraLandPricePerSqYard = entity.getNewExtraLandPricePerSqYard();
        dto.newPaymentTillNow = entity.getNewPaymentTillNow();
        dto.newTotalSftPerVilla = entity.getNewTotalSftPerVilla();
        dto.newTotalSftPrice = entity.getNewTotalSftPrice();
        dto.newExtraLandTotal = entity.getNewExtraLandTotal();
        dto.newBasePriceAmount = entity.getNewBasePriceAmount();
        dto.newBalanceInBasePrice = entity.getNewBalanceInBasePrice();
        dto.clubHouseApplicable = entity.getClubHouseApplicable();
        dto.clubHouseAmount = entity.getClubHouseAmount();
        dto.corpusFundApplicable = entity.getCorpusFundApplicable();
        dto.corpusFundAmount = entity.getCorpusFundAmount();
        dto.legalChargesApplicable = entity.getLegalChargesApplicable();
        dto.legalChargesAmount = entity.getLegalChargesAmount();
        dto.cautionDepositApplicable = entity.getCautionDepositApplicable();
        dto.cautionDepositAmount = entity.getCautionDepositAmount();
        dto.advanceMaintenanceApplicable = entity.getAdvanceMaintenanceApplicable();
        dto.advanceMaintenanceRate = entity.getAdvanceMaintenanceRate();
        dto.advanceMaintenanceMonths = entity.getAdvanceMaintenanceMonths();
        dto.advanceMaintenanceAmount = entity.getAdvanceMaintenanceAmount();
        dto.newAdvanceMaintenanceAmount = entity.getNewAdvanceMaintenanceAmount();
        dto.registrationPaymentApplicable = entity.getRegistrationPaymentApplicable();
        dto.gstPercentage = entity.getGstPercentage();
        dto.gstAmount = entity.getGstAmount();
        dto.newGstAmount = entity.getNewGstAmount();
        dto.stampDutyPercentage = entity.getStampDutyPercentage();
        dto.stampDutyAmount = entity.getStampDutyAmount();
        dto.newStampDutyAmount = entity.getNewStampDutyAmount();
        dto.salePriceRowsJson = entity.getSalePriceRowsJson();
        dto.createdAt = entity.getCreatedAt();
        dto.updatedAt = entity.getUpdatedAt();
        return dto;
    }
}
