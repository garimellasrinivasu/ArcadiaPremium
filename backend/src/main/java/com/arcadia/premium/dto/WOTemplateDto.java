package com.arcadia.premium.dto;

import com.arcadia.premium.model.WOTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class WOTemplateDto {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String defaultContractType;
    private String defaultTermsAndConditions;
    private String defaultAdvanceType;
    private BigDecimal defaultAdvanceValue;
    private String defaultRetentionType;
    private BigDecimal defaultRetentionValue;
    private boolean active;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WOTemplateDto fromEntity(WOTemplate e) {
        WOTemplateDto d = new WOTemplateDto();
        d.id = e.getId();
        d.code = e.getCode();
        d.name = e.getName();
        d.description = e.getDescription();
        d.defaultContractType = e.getDefaultContractType();
        d.defaultTermsAndConditions = e.getDefaultTermsAndConditions();
        d.defaultAdvanceType = e.getDefaultAdvanceType();
        d.defaultAdvanceValue = e.getDefaultAdvanceValue();
        d.defaultRetentionType = e.getDefaultRetentionType();
        d.defaultRetentionValue = e.getDefaultRetentionValue();
        d.active = e.isActive();
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

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
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
