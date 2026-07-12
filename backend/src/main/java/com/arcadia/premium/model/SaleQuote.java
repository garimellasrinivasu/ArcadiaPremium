package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sale_quote")
public class SaleQuote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate quoteDate;

    // Customer details
    @Column(nullable = false)
    private String customerName;

    private String customerPhone;

    private String plotNo;

    // Villa/Plot details
    @Column(nullable = false)
    private Integer plotAreaSqYards;

    @Column(nullable = false)
    private Double constructionRatio;

    @Column(nullable = false)
    private Integer totalConstructionSft;

    // Pricing
    /** OTP, GENERAL, SPLIT */
    @Column(nullable = false)
    private String pricingOption;

    private BigDecimal ratePerSft;

    // For split pricing
    private Double splitOtpPercent;
    private Double splitGeneralPercent;
    private BigDecimal splitOtpRate;
    private BigDecimal splitGeneralRate;

    @Column(nullable = false)
    private BigDecimal saleValue;

    // Additional charges
    private BigDecimal clubHouseCharges;
    private BigDecimal corpusFund;
    private BigDecimal legalCharges;
    private BigDecimal cautionDeposit;
    private BigDecimal advanceMaintenance;
    private BigDecimal additionalChargesTotal;

    // PLC (Premium Location Charges)
    private BigDecimal plcTotal;
    @Column(length = 500)
    private String plcDetails;

    // Extra Land Cost
    @Column(name = "extra_land_sq_yards")
    private BigDecimal extraLandSqYards;

    @Column(name = "land_rate_per_sq_yard")
    private BigDecimal landRatePerSqYard;

    @Column(name = "total_land_cost")
    private BigDecimal totalLandCost;

    @Column(name = "basic_sale_value")
    private BigDecimal basicSaleValue;

    // Grand total
    @Column(nullable = false)
    private BigDecimal grandTotal;

    // Amount in words
    @Column(length = 500)
    private String amountInWords;

    // Who created
    private String createdBy;

    private String salesPerson;

    @Column(length = 1000)
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getQuoteDate() { return quoteDate; }
    public void setQuoteDate(LocalDate quoteDate) { this.quoteDate = quoteDate; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getPlotNo() { return plotNo; }
    public void setPlotNo(String plotNo) { this.plotNo = plotNo; }

    public Integer getPlotAreaSqYards() { return plotAreaSqYards; }
    public void setPlotAreaSqYards(Integer plotAreaSqYards) { this.plotAreaSqYards = plotAreaSqYards; }

    public Double getConstructionRatio() { return constructionRatio; }
    public void setConstructionRatio(Double constructionRatio) { this.constructionRatio = constructionRatio; }

    public Integer getTotalConstructionSft() { return totalConstructionSft; }
    public void setTotalConstructionSft(Integer totalConstructionSft) { this.totalConstructionSft = totalConstructionSft; }

    public String getPricingOption() { return pricingOption; }
    public void setPricingOption(String pricingOption) { this.pricingOption = pricingOption; }

    public BigDecimal getRatePerSft() { return ratePerSft; }
    public void setRatePerSft(BigDecimal ratePerSft) { this.ratePerSft = ratePerSft; }

    public Double getSplitOtpPercent() { return splitOtpPercent; }
    public void setSplitOtpPercent(Double splitOtpPercent) { this.splitOtpPercent = splitOtpPercent; }

    public Double getSplitGeneralPercent() { return splitGeneralPercent; }
    public void setSplitGeneralPercent(Double splitGeneralPercent) { this.splitGeneralPercent = splitGeneralPercent; }

    public BigDecimal getSplitOtpRate() { return splitOtpRate; }
    public void setSplitOtpRate(BigDecimal splitOtpRate) { this.splitOtpRate = splitOtpRate; }

    public BigDecimal getSplitGeneralRate() { return splitGeneralRate; }
    public void setSplitGeneralRate(BigDecimal splitGeneralRate) { this.splitGeneralRate = splitGeneralRate; }

    public BigDecimal getSaleValue() { return saleValue; }
    public void setSaleValue(BigDecimal saleValue) { this.saleValue = saleValue; }

    public BigDecimal getClubHouseCharges() { return clubHouseCharges; }
    public void setClubHouseCharges(BigDecimal clubHouseCharges) { this.clubHouseCharges = clubHouseCharges; }

    public BigDecimal getCorpusFund() { return corpusFund; }
    public void setCorpusFund(BigDecimal corpusFund) { this.corpusFund = corpusFund; }

    public BigDecimal getLegalCharges() { return legalCharges; }
    public void setLegalCharges(BigDecimal legalCharges) { this.legalCharges = legalCharges; }

    public BigDecimal getCautionDeposit() { return cautionDeposit; }
    public void setCautionDeposit(BigDecimal cautionDeposit) { this.cautionDeposit = cautionDeposit; }

    public BigDecimal getAdvanceMaintenance() { return advanceMaintenance; }
    public void setAdvanceMaintenance(BigDecimal advanceMaintenance) { this.advanceMaintenance = advanceMaintenance; }

    public BigDecimal getAdditionalChargesTotal() { return additionalChargesTotal; }
    public void setAdditionalChargesTotal(BigDecimal additionalChargesTotal) { this.additionalChargesTotal = additionalChargesTotal; }

    public BigDecimal getPlcTotal() { return plcTotal; }
    public void setPlcTotal(BigDecimal plcTotal) { this.plcTotal = plcTotal; }

    public String getPlcDetails() { return plcDetails; }
    public void setPlcDetails(String plcDetails) { this.plcDetails = plcDetails; }

    public BigDecimal getExtraLandSqYards() { return extraLandSqYards; }
    public void setExtraLandSqYards(BigDecimal extraLandSqYards) { this.extraLandSqYards = extraLandSqYards; }

    public BigDecimal getLandRatePerSqYard() { return landRatePerSqYard; }
    public void setLandRatePerSqYard(BigDecimal landRatePerSqYard) { this.landRatePerSqYard = landRatePerSqYard; }

    public BigDecimal getTotalLandCost() { return totalLandCost; }
    public void setTotalLandCost(BigDecimal totalLandCost) { this.totalLandCost = totalLandCost; }

    public BigDecimal getBasicSaleValue() { return basicSaleValue; }
    public void setBasicSaleValue(BigDecimal basicSaleValue) { this.basicSaleValue = basicSaleValue; }

    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }

    public String getAmountInWords() { return amountInWords; }
    public void setAmountInWords(String amountInWords) { this.amountInWords = amountInWords; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getSalesPerson() { return salesPerson; }
    public void setSalesPerson(String salesPerson) { this.salesPerson = salesPerson; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
