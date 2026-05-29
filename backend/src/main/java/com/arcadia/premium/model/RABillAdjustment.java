package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Additions, deductions, and recovery adjustments for RA Bills.
 */
@Entity
@Table(name = "ra_bill_adjustments")
public class RABillAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ra_bill_id", nullable = false)
    private RABill raBill;

    /** ADDITION or DEDUCTION */
    private String adjustmentType;

    /** REFUNDABLE or NON_REFUNDABLE */
    private String nature;

    private String description;

    @Column(precision = 15, scale = 2)
    private BigDecimal amount;

    private boolean released = false;

    /** ID of the bill where this adjustment was released */
    @Column(name = "released_in_bill_id")
    private Long releasedInBillId;

    public RABillAdjustment() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RABill getRaBill() { return raBill; }
    public void setRaBill(RABill raBill) { this.raBill = raBill; }
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
