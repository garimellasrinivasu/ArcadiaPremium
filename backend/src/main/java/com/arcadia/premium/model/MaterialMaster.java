package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "material_master")
public class MaterialMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_group_id", nullable = false)
    private MaterialGroup materialGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_sub_group_id")
    private MaterialSubGroup materialSubGroup;

    /** Unit of measurement: Kg, MT, Bags, Nos, Litre, Sqm, Rmt, Cum, Cft, Brass */
    @Column(nullable = false)
    private String uom;

    private String hsnCode;

    private String brand;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public MaterialMaster() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public MaterialGroup getMaterialGroup() { return materialGroup; }
    public void setMaterialGroup(MaterialGroup materialGroup) { this.materialGroup = materialGroup; }
    public MaterialSubGroup getMaterialSubGroup() { return materialSubGroup; }
    public void setMaterialSubGroup(MaterialSubGroup materialSubGroup) { this.materialSubGroup = materialSubGroup; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
