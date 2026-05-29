package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "indent_items")
public class IndentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indent_id", nullable = false)
    private MaterialIndent indent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private MaterialMaster material;

    private String uom;

    @Column(precision = 15, scale = 4)
    private BigDecimal indentQty;

    @Column(precision = 15, scale = 4)
    private BigDecimal poQty = BigDecimal.ZERO;

    private String remarks;

    public IndentItem() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MaterialIndent getIndent() { return indent; }
    public void setIndent(MaterialIndent indent) { this.indent = indent; }
    public MaterialMaster getMaterial() { return material; }
    public void setMaterial(MaterialMaster material) { this.material = material; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getIndentQty() { return indentQty; }
    public void setIndentQty(BigDecimal indentQty) { this.indentQty = indentQty; }
    public BigDecimal getPoQty() { return poQty; }
    public void setPoQty(BigDecimal poQty) { this.poQty = poQty; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
