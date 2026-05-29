package com.arcadia.premium.dto;

import com.arcadia.premium.model.RABillAdjustment;

import java.math.BigDecimal;

public class RABillAdjustmentDto {
    private Long id;
    private String adjustmentType;
    private String nature;
    private String description;
    private BigDecimal amount;
    private boolean released;
    private Long releasedInBillId;

    public static RABillAdjustmentDto fromEntity(RABillAdjustment e) {
        RABillAdjustmentDto d = new RABillAdjustmentDto();
        d.id = e.getId();
        d.adjustmentType = e.getAdjustmentType();
        d.nature = e.getNature();
        d.description = e.getDescription();
        d.amount = e.getAmount();
        d.released = e.isReleased();
        d.releasedInBillId = e.getReleasedInBillId();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAdjustmentType() { return adjustmentType; }
    public void setAdjustmentType(String adjustmentType) { this.adjustmentType = adjustmentType; }
    public String getNature() { return nature; }
    public void setNature(String nature) { this.nature = nature; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public boolean isReleased() { return released; }
    public void setReleased(boolean released) { this.released = released; }
    public Long getReleasedInBillId() { return releasedInBillId; }
    public void setReleasedInBillId(Long releasedInBillId) { this.releasedInBillId = releasedInBillId; }
}
