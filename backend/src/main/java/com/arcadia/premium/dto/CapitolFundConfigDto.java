package com.arcadia.premium.dto;

import com.arcadia.premium.model.CapitolFundConfig;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CapitolFundConfigDto {

    private Long id;
    private BigDecimal sftPrice;
    private BigDecimal defaultInterestRate;
    private String updatedBy;
    private LocalDateTime updatedAt;

    public CapitolFundConfigDto() {}

    public static CapitolFundConfigDto fromEntity(CapitolFundConfig entity) {
        CapitolFundConfigDto dto = new CapitolFundConfigDto();
        dto.setId(entity.getId());
        dto.setSftPrice(entity.getSftPrice());
        dto.setDefaultInterestRate(entity.getDefaultInterestRate());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

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
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
