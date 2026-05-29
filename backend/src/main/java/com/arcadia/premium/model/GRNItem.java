package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "grn_items")
public class GRNItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grn_id", nullable = false)
    private GoodsReceiptNote grn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private MaterialMaster material;

    private String uom;

    @Column(precision = 15, scale = 4)
    private BigDecimal grnQty;

    @Column(precision = 15, scale = 4)
    private BigDecimal acceptedQty;

    @Column(precision = 15, scale = 4)
    private BigDecimal rejectedQty = BigDecimal.ZERO;

    private String inspectionType;

    private String inspectedBy;

    private String remarks;

    public GRNItem() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public GoodsReceiptNote getGrn() { return grn; }
    public void setGrn(GoodsReceiptNote grn) { this.grn = grn; }
    public MaterialMaster getMaterial() { return material; }
    public void setMaterial(MaterialMaster material) { this.material = material; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getGrnQty() { return grnQty; }
    public void setGrnQty(BigDecimal grnQty) { this.grnQty = grnQty; }
    public BigDecimal getAcceptedQty() { return acceptedQty; }
    public void setAcceptedQty(BigDecimal acceptedQty) { this.acceptedQty = acceptedQty; }
    public BigDecimal getRejectedQty() { return rejectedQty; }
    public void setRejectedQty(BigDecimal rejectedQty) { this.rejectedQty = rejectedQty; }
    public String getInspectionType() { return inspectionType; }
    public void setInspectionType(String inspectionType) { this.inspectionType = inspectionType; }
    public String getInspectedBy() { return inspectedBy; }
    public void setInspectedBy(String inspectedBy) { this.inspectedBy = inspectedBy; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
