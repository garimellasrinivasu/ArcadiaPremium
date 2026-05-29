package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "requisition_items")
public class RequisitionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id", nullable = false)
    private MaterialRequisition requisition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private MaterialMaster material;

    private String uom;

    @Column(precision = 15, scale = 4)
    private BigDecimal requisitionQty;

    @Column(precision = 15, scale = 4)
    private BigDecimal issuedQty = BigDecimal.ZERO;

    @Column(precision = 15, scale = 4)
    private BigDecimal indentedQty = BigDecimal.ZERO;

    private String remarks;

    public RequisitionItem() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MaterialRequisition getRequisition() { return requisition; }
    public void setRequisition(MaterialRequisition requisition) { this.requisition = requisition; }
    public MaterialMaster getMaterial() { return material; }
    public void setMaterial(MaterialMaster material) { this.material = material; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getRequisitionQty() { return requisitionQty; }
    public void setRequisitionQty(BigDecimal requisitionQty) { this.requisitionQty = requisitionQty; }
    public BigDecimal getIssuedQty() { return issuedQty; }
    public void setIssuedQty(BigDecimal issuedQty) { this.issuedQty = issuedQty; }
    public BigDecimal getIndentedQty() { return indentedQty; }
    public void setIndentedQty(BigDecimal indentedQty) { this.indentedQty = indentedQty; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
