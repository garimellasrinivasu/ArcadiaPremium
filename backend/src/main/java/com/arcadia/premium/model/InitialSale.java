package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "initial_sales")
public class InitialSale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Basic Info ---

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "sq_yards_villa", nullable = false)
    private Integer sqYardsVilla;

    @Column(name = "villa_number")
    private String villaNumber;

    @Column(name = "sale_mode")
    private String saleMode;

    @Column(name = "project_name")
    private String projectName;

    // --- Original Quote Values ---

    @Column(name = "sft_per_sq_yard")
    private Double sftPerSqYard;

    @Column(name = "sale_price_per_sft")
    private Double salePricePerSft;

    @Column(name = "default_facing")
    private String defaultFacing;

    @Column(name = "facing_charges")
    private Double facingCharges;

    @Column(name = "extra_land_sq_yards")
    private Integer extraLandSqYards = 0;

    @Column(name = "extra_land_price_per_sq_yard")
    private Double extraLandPricePerSqYard = 0.0;

    @Column(name = "payment_till_now")
    private Double paymentTillNow = 0.0;

    // --- Calculated Original Snapshots ---

    @Column(name = "total_sft_per_villa")
    private Integer totalSftPerVilla;

    @Column(name = "total_sft_price")
    private Double totalSftPrice;

    @Column(name = "extra_land_total")
    private Double extraLandTotal;

    @Column(name = "base_price_amount")
    private Double basePriceAmount;

    @Column(name = "balance_in_base_price")
    private Double balanceInBasePrice;

    // --- Revised ("new" prefix) Quote Values ---

    @Column(name = "new_sft_per_sq_yard")
    private Double newSftPerSqYard;

    @Column(name = "new_sale_price_per_sft")
    private Double newSalePricePerSft;

    @Column(name = "new_default_facing")
    private String newDefaultFacing;

    @Column(name = "new_facing_charges")
    private Double newFacingCharges;

    @Column(name = "new_extra_land_sq_yards")
    private Integer newExtraLandSqYards;

    @Column(name = "new_extra_land_price_per_sq_yard")
    private Double newExtraLandPricePerSqYard;

    @Column(name = "new_payment_till_now")
    private Double newPaymentTillNow;

    @Column(name = "new_total_sft_per_villa")
    private Integer newTotalSftPerVilla;

    @Column(name = "new_total_sft_price")
    private Double newTotalSftPrice;

    @Column(name = "new_extra_land_total")
    private Double newExtraLandTotal;

    @Column(name = "new_base_price_amount")
    private Double newBasePriceAmount;

    @Column(name = "new_balance_in_base_price")
    private Double newBalanceInBasePrice;

    // --- Additional Charges (shared) ---

    @Column(name = "club_house_applicable")
    private Boolean clubHouseApplicable = false;

    @Column(name = "club_house_amount")
    private Double clubHouseAmount = 0.0;

    @Column(name = "corpus_fund_applicable")
    private Boolean corpusFundApplicable = true;

    @Column(name = "corpus_fund_amount")
    private Double corpusFundAmount = 100000.0;

    @Column(name = "legal_charges_applicable")
    private Boolean legalChargesApplicable = true;

    @Column(name = "legal_charges_amount")
    private Double legalChargesAmount = 25000.0;

    @Column(name = "caution_deposit_applicable")
    private Boolean cautionDepositApplicable = true;

    @Column(name = "caution_deposit_amount")
    private Double cautionDepositAmount = 50000.0;

    @Column(name = "advance_maintenance_applicable")
    private Boolean advanceMaintenanceApplicable = true;

    @Column(name = "advance_maintenance_rate")
    private Double advanceMaintenanceRate = 3.5;

    @Column(name = "advance_maintenance_months")
    private Integer advanceMaintenanceMonths = 24;

    @Column(name = "advance_maintenance_amount")
    private Double advanceMaintenanceAmount;

    @Column(name = "new_advance_maintenance_amount")
    private Double newAdvanceMaintenanceAmount;

    @Column(name = "registration_payment_applicable")
    private Boolean registrationPaymentApplicable = true;

    // --- GST and Stamp Duty ---

    @Column(name = "gst_percentage")
    private Double gstPercentage = 5.0;

    @Column(name = "gst_amount")
    private Double gstAmount;

    @Column(name = "new_gst_amount")
    private Double newGstAmount;

    @Column(name = "stamp_duty_percentage")
    private Double stampDutyPercentage = 7.6;

    @Column(name = "stamp_duty_amount")
    private Double stampDutyAmount;

    @Column(name = "new_stamp_duty_amount")
    private Double newStampDutyAmount;

    @Column(name = "sale_price_rows_json", columnDefinition = "TEXT")
    private String salePriceRowsJson;

    // --- Timestamps ---

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public InitialSale() {}

    // --- Getters & Setters ---

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
}
