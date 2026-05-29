package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Work Done bill line items, linked to MB measurements.
 */
@Entity
@Table(name = "ra_bill_items")
public class RABillItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ra_bill_id", nullable = false)
    private RABill raBill;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private ActivityMaster activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "measurement_book_id")
    private MeasurementBook measurementBook;

    private String uom;

    /** Work Order qty */
    @Column(precision = 15, scale = 4)
    private BigDecimal woQty;

    /** Work Order rate */
    @Column(precision = 15, scale = 2)
    private BigDecimal woRate;

    @Column(precision = 15, scale = 4)
    private BigDecimal previousQty = BigDecimal.ZERO;

    @Column(precision = 15, scale = 4)
    private BigDecimal currentQty = BigDecimal.ZERO;

    @Column(precision = 15, scale = 4)
    private BigDecimal cumulativeQty = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal currentAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal cumulativeAmount = BigDecimal.ZERO;

    private Double paymentReleasePercent = 100.0;

    public RABillItem() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RABill getRaBill() { return raBill; }
    public void setRaBill(RABill raBill) { this.raBill = raBill; }
    public ActivityMaster getActivity() { return activity; }
    public void setActivity(ActivityMaster activity) { this.activity = activity; }
    public MeasurementBook getMeasurementBook() { return measurementBook; }
    public void setMeasurementBook(MeasurementBook measurementBook) { this.measurementBook = measurementBook; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getWoQty() { return woQty; }
    public void setWoQty(BigDecimal woQty) { this.woQty = woQty; }
    public BigDecimal getWoRate() { return woRate; }
    public void setWoRate(BigDecimal woRate) { this.woRate = woRate; }
    public BigDecimal getPreviousQty() { return previousQty; }
    public void setPreviousQty(BigDecimal previousQty) { this.previousQty = previousQty; }
    public BigDecimal getCurrentQty() { return currentQty; }
    public void setCurrentQty(BigDecimal currentQty) { this.currentQty = currentQty; }
    public BigDecimal getCumulativeQty() { return cumulativeQty; }
    public void setCumulativeQty(BigDecimal cumulativeQty) { this.cumulativeQty = cumulativeQty; }
    public BigDecimal getCurrentAmount() { return currentAmount; }
    public void setCurrentAmount(BigDecimal currentAmount) { this.currentAmount = currentAmount; }
    public BigDecimal getCumulativeAmount() { return cumulativeAmount; }
    public void setCumulativeAmount(BigDecimal cumulativeAmount) { this.cumulativeAmount = cumulativeAmount; }
    public Double getPaymentReleasePercent() { return paymentReleasePercent; }
    public void setPaymentReleasePercent(Double paymentReleasePercent) { this.paymentReleasePercent = paymentReleasePercent; }
}
