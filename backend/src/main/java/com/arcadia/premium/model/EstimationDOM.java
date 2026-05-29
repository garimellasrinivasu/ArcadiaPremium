package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Details of Measurement (DOM) — each row captures L x B x H dimensions
 * for a particular item in a Job Estimation line.
 */
@Entity
@Table(name = "estimation_dom")
public class EstimationDOM {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_estimation_id", nullable = false)
    private JobEstimation jobEstimation;

    /** Serial / item number within the estimation line */
    private Integer itemNo;

    /** Description of measurement item */
    private String description;

    /** Number of items (Nos) */
    @Column(precision = 10, scale = 2)
    private BigDecimal nos = BigDecimal.ONE;

    /** Length */
    @Column(precision = 10, scale = 4)
    private BigDecimal length = BigDecimal.ZERO;

    /** Breadth */
    @Column(precision = 10, scale = 4)
    private BigDecimal breadth = BigDecimal.ZERO;

    /** Height / Depth */
    @Column(precision = 10, scale = 4)
    private BigDecimal height = BigDecimal.ZERO;

    /** Computed: nos * length * breadth * height */
    @Column(precision = 15, scale = 4)
    private BigDecimal quantity = BigDecimal.ZERO;

    public EstimationDOM() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public JobEstimation getJobEstimation() { return jobEstimation; }
    public void setJobEstimation(JobEstimation jobEstimation) { this.jobEstimation = jobEstimation; }
    public Integer getItemNo() { return itemNo; }
    public void setItemNo(Integer itemNo) { this.itemNo = itemNo; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getNos() { return nos; }
    public void setNos(BigDecimal nos) { this.nos = nos; }
    public BigDecimal getLength() { return length; }
    public void setLength(BigDecimal length) { this.length = length; }
    public BigDecimal getBreadth() { return breadth; }
    public void setBreadth(BigDecimal breadth) { this.breadth = breadth; }
    public BigDecimal getHeight() { return height; }
    public void setHeight(BigDecimal height) { this.height = height; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
}
