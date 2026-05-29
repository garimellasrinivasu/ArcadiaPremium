package com.arcadia.premium.dto;

import com.arcadia.premium.model.RateAnalysisItem;

import java.math.BigDecimal;

public class RateAnalysisItemDto {

    private Long id;
    private String category;
    private String description;
    private String uom;
    private BigDecimal coefficient;
    private BigDecimal rate;
    private BigDecimal amount;
    private Integer sortOrder;

    public static RateAnalysisItemDto fromEntity(RateAnalysisItem e) {
        RateAnalysisItemDto d = new RateAnalysisItemDto();
        d.id = e.getId();
        d.category = e.getCategory();
        d.description = e.getDescription();
        d.uom = e.getUom();
        d.coefficient = e.getCoefficient();
        d.rate = e.getRate();
        d.amount = e.getAmount();
        d.sortOrder = e.getSortOrder();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getCoefficient() { return coefficient; }
    public void setCoefficient(BigDecimal coefficient) { this.coefficient = coefficient; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
