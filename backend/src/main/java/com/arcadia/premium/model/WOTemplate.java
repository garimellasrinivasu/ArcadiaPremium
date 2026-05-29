package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wo_templates")
public class WOTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Auto-generated: WOT-001, WOT-002, etc. */
    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    private String defaultContractType;

    @Column(length = 4000)
    private String defaultTermsAndConditions;

    private String defaultAdvanceType;

    @Column(precision = 15, scale = 2)
    private BigDecimal defaultAdvanceValue;

    private String defaultRetentionType;

    @Column(precision = 15, scale = 2)
    private BigDecimal defaultRetentionValue;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public WOTemplate() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDefaultContractType() { return defaultContractType; }
    public void setDefaultContractType(String defaultContractType) { this.defaultContractType = defaultContractType; }
    public String getDefaultTermsAndConditions() { return defaultTermsAndConditions; }
    public void setDefaultTermsAndConditions(String defaultTermsAndConditions) { this.defaultTermsAndConditions = defaultTermsAndConditions; }
    public String getDefaultAdvanceType() { return defaultAdvanceType; }
    public void setDefaultAdvanceType(String defaultAdvanceType) { this.defaultAdvanceType = defaultAdvanceType; }
    public BigDecimal getDefaultAdvanceValue() { return defaultAdvanceValue; }
    public void setDefaultAdvanceValue(BigDecimal defaultAdvanceValue) { this.defaultAdvanceValue = defaultAdvanceValue; }
    public String getDefaultRetentionType() { return defaultRetentionType; }
    public void setDefaultRetentionType(String defaultRetentionType) { this.defaultRetentionType = defaultRetentionType; }
    public BigDecimal getDefaultRetentionValue() { return defaultRetentionValue; }
    public void setDefaultRetentionValue(BigDecimal defaultRetentionValue) { this.defaultRetentionValue = defaultRetentionValue; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
