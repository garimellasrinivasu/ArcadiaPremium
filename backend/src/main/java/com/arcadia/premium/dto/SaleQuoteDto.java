package com.arcadia.premium.dto;

import com.arcadia.premium.model.SaleQuote;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class SaleQuoteDto {

    private Long id;
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
    private BigDecimal extraLandSqYards;
    private BigDecimal landRatePerSqYard;
    private BigDecimal totalLandCost;
    private BigDecimal basicSaleValue;
    private BigDecimal grandTotal;
    private String amountInWords;
    private String createdBy;
    private String salesPerson;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SaleQuoteDto fromEntity(SaleQuote e) {
        SaleQuoteDto dto = new SaleQuoteDto();
        dto.setId(e.getId());
        dto.setQuoteDate(e.getQuoteDate());
        dto.setCustomerName(e.getCustomerName());
        dto.setCustomerPhone(e.getCustomerPhone());
        dto.setPlotNo(e.getPlotNo());
        dto.setPlotAreaSqYards(e.getPlotAreaSqYards());
        dto.setConstructionRatio(e.getConstructionRatio());
        dto.setTotalConstructionSft(e.getTotalConstructionSft());
        dto.setPricingOption(e.getPricingOption());
        dto.setRatePerSft(e.getRatePerSft());
        dto.setSplitOtpPercent(e.getSplitOtpPercent());
        dto.setSplitGeneralPercent(e.getSplitGeneralPercent());
        dto.setSplitOtpRate(e.getSplitOtpRate());
        dto.setSplitGeneralRate(e.getSplitGeneralRate());
        dto.setSaleValue(e.getSaleValue());
        dto.setClubHouseCharges(e.getClubHouseCharges());
        dto.setCorpusFund(e.getCorpusFund());
        dto.setLegalCharges(e.getLegalCharges());
        dto.setCautionDeposit(e.getCautionDeposit());
        dto.setAdvanceMaintenance(e.getAdvanceMaintenance());
        dto.setAdditionalChargesTotal(e.getAdditionalChargesTotal());
        dto.setPlcTotal(e.getPlcTotal());
        dto.setPlcDetails(e.getPlcDetails());
        dto.setExtraLandSqYards(e.getExtraLandSqYards());
        dto.setLandRatePerSqYard(e.getLandRatePerSqYard());
        dto.setTotalLandCost(e.getTotalLandCost());
        dto.setBasicSaleValue(e.getBasicSaleValue());
        dto.setGrandTotal(e.getGrandTotal());
        dto.setAmountInWords(e.getAmountInWords());
        dto.setCreatedBy(e.getCreatedBy());
        dto.setSalesPerson(e.getSalesPerson());
        dto.setNotes(e.getNotes());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }

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
