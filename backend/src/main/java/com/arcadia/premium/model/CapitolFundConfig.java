package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "capitol_fund_config")
public class CapitolFundConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Current SFT price in Rupees */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal sftPrice = new BigDecimal("7000.00");

    /** Default monthly interest rate (e.g. 1.50 means Rs 1.50 per 100 = 1.5%) */
    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal defaultInterestRate = new BigDecimal("1.50");

    @Column(nullable = false)
    private String updatedBy = "SYSTEM";

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public CapitolFundConfig() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getSftPrice() { return sftPrice; }
    public void setSftPrice(BigDecimal sftPrice) { this.sftPrice = sftPrice; }

    public BigDecimal getDefaultInterestRate() { return defaultInterestRate; }
    public void setDefaultInterestRate(BigDecimal defaultInterestRate) { this.defaultInterestRate = defaultInterestRate; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
