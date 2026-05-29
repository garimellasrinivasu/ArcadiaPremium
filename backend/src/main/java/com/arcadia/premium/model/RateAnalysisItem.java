package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "rate_analysis_items")
public class RateAnalysisItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rate_analysis_id", nullable = false)
    private RateAnalysis rateAnalysis;

    /** MATERIAL, LABOR, MACHINERY, OTHER */
    @Column(nullable = false)
    private String category;

    /** Name of the material/labor/machine */
    @Column(length = 500)
    private String description;

    private String uom;

    /** Factor required for 1 unit of BOQ quantity */
    @Column(nullable = false, precision = 15, scale = 4)
    private BigDecimal coefficient = BigDecimal.ZERO;

    /** Rate per unit */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal rate = BigDecimal.ZERO;

    /** Computed: coefficient * rate */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    private Integer sortOrder;

    public RateAnalysisItem() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RateAnalysis getRateAnalysis() { return rateAnalysis; }
    public void setRateAnalysis(RateAnalysis rateAnalysis) { this.rateAnalysis = rateAnalysis; }
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
