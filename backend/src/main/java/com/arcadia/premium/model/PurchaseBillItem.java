package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "purchase_bill_items")
public class PurchaseBillItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_bill_id", nullable = false)
    private PurchaseBill purchaseBill;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private MaterialMaster material;

    private String uom;

    @Column(precision = 15, scale = 4)
    private BigDecimal billQty;

    @Column(precision = 15, scale = 2)
    private BigDecimal rate;

    @Column(precision = 15, scale = 2)
    private BigDecimal amount;

    public PurchaseBillItem() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PurchaseBill getPurchaseBill() { return purchaseBill; }
    public void setPurchaseBill(PurchaseBill purchaseBill) { this.purchaseBill = purchaseBill; }
    public MaterialMaster getMaterial() { return material; }
    public void setMaterial(MaterialMaster material) { this.material = material; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getBillQty() { return billQty; }
    public void setBillQty(BigDecimal billQty) { this.billQty = billQty; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
