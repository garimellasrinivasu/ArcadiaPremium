package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "work_order_items")
public class WorkOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private ActivityMaster activity;

    private String description;

    private String uom;

    @Column(precision = 15, scale = 4)
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal rate = BigDecimal.ZERO;

    /** quantity * rate */
    @Column(precision = 15, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    public WorkOrderItem() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public WorkOrder getWorkOrder() { return workOrder; }
    public void setWorkOrder(WorkOrder workOrder) { this.workOrder = workOrder; }
    public ActivityMaster getActivity() { return activity; }
    public void setActivity(ActivityMaster activity) { this.activity = activity; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
