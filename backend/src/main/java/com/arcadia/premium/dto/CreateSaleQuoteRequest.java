package com.arcadia.premium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateSaleQuoteRequest {

    private LocalDate quoteDate;
    private String customerName;
    private String customerPhone;
    private String plotNo;
    private Integer plotAreaSqYards;
    private Double constructionRatio;
    private Integer totalConstructionSft;
    private String pricingOption;
    private BigDecimal ratePerSft;
    private Double splitOtpPercent;
    private Double splitGeneralPercent;
    private BigDecimal splitOtpRate;
    private BigDecimal splitGeneralRate;
    private BigDecimal saleValue;
    private BigDecimal clubHouseCharges;
    private BigDecimal corpusFund;
    private BigDecimal legalCharges;
    private BigDecimal cautionDeposit;
    private BigDecimal advanceMaintenance;
    private BigDecimal additionalChargesTotal;
    private BigDecimal plcTotal;
    private String plcDetails;
    private BigDecimal grandTotal;
    private String amountInWords;
    private String salesPerson;
    private String notes;

    // Getters & Setters
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

    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }

    public String getAmountInWords() { return amountInWords; }
    public void setAmountInWords(String amountInWords) { this.amountInWords = amountInWords; }

    public String getSalesPerson() { return salesPerson; }
    public void setSalesPerson(String salesPerson) { this.salesPerson = salesPerson; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
