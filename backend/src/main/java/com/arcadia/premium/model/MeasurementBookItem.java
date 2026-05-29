package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "measurement_book_items")
public class MeasurementBookItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "measurement_book_id", nullable = false)
    private MeasurementBook measurementBook;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private ActivityMaster activity;

    private String uom;

    /** Previously measured cumulative qty */
    @Column(precision = 15, scale = 4)
    private BigDecimal previousMeasuredQty = BigDecimal.ZERO;

    /** Current MB measured qty */
    @Column(precision = 15, scale = 4)
    private BigDecimal currentMeasuredQty = BigDecimal.ZERO;

    /** Cumulative = previous + current */
    @Column(precision = 15, scale = 4)
    private BigDecimal cumulativeMeasuredQty = BigDecimal.ZERO;

    /** Work Order qty reference */
    @Column(precision = 15, scale = 4)
    private BigDecimal woQty;

    private String remarks;

    @OneToMany(mappedBy = "mbItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MBItemDetail> details = new ArrayList<>();

    public MeasurementBookItem() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MeasurementBook getMeasurementBook() { return measurementBook; }
    public void setMeasurementBook(MeasurementBook measurementBook) { this.measurementBook = measurementBook; }
    public ActivityMaster getActivity() { return activity; }
    public void setActivity(ActivityMaster activity) { this.activity = activity; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getPreviousMeasuredQty() { return previousMeasuredQty; }
    public void setPreviousMeasuredQty(BigDecimal previousMeasuredQty) { this.previousMeasuredQty = previousMeasuredQty; }
    public BigDecimal getCurrentMeasuredQty() { return currentMeasuredQty; }
    public void setCurrentMeasuredQty(BigDecimal currentMeasuredQty) { this.currentMeasuredQty = currentMeasuredQty; }
    public BigDecimal getCumulativeMeasuredQty() { return cumulativeMeasuredQty; }
    public void setCumulativeMeasuredQty(BigDecimal cumulativeMeasuredQty) { this.cumulativeMeasuredQty = cumulativeMeasuredQty; }
    public BigDecimal getWoQty() { return woQty; }
    public void setWoQty(BigDecimal woQty) { this.woQty = woQty; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<MBItemDetail> getDetails() { return details; }
    public void setDetails(List<MBItemDetail> details) { this.details = details; }
}
