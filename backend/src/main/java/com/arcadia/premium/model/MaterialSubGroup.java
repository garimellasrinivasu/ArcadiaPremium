package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "material_sub_groups")
public class MaterialSubGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    /** Allowable variation percentage */
    private Double tolerancePercent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_group_id", nullable = false)
    private MaterialGroup materialGroup;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public MaterialSubGroup() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getTolerancePercent() { return tolerancePercent; }
    public void setTolerancePercent(Double tolerancePercent) { this.tolerancePercent = tolerancePercent; }
    public MaterialGroup getMaterialGroup() { return materialGroup; }
    public void setMaterialGroup(MaterialGroup materialGroup) { this.materialGroup = materialGroup; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
