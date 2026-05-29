package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "material_issue_items")
public class MaterialIssueItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_issue_id", nullable = false)
    private MaterialIssue materialIssue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private MaterialMaster material;

    private String uom;

    @Column(precision = 15, scale = 4)
    private BigDecimal issueQty;

    /** For reference - available stock quantity */
    @Column(precision = 15, scale = 4)
    private BigDecimal stockQty;

    private String remarks;

    public MaterialIssueItem() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MaterialIssue getMaterialIssue() { return materialIssue; }
    public void setMaterialIssue(MaterialIssue materialIssue) { this.materialIssue = materialIssue; }
    public MaterialMaster getMaterial() { return material; }
    public void setMaterial(MaterialMaster material) { this.material = material; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getIssueQty() { return issueQty; }
    public void setIssueQty(BigDecimal issueQty) { this.issueQty = issueQty; }
    public BigDecimal getStockQty() { return stockQty; }
    public void setStockQty(BigDecimal stockQty) { this.stockQty = stockQty; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
