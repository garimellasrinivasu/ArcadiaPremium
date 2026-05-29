package com.arcadia.premium.dto;

import com.arcadia.premium.model.MaterialMaster;

import java.time.LocalDateTime;

public class MaterialMasterDto {
    private Long id;
    private String name;
    private String description;
    private Long materialGroupId;
    private String materialGroupName;
    private Long materialSubGroupId;
    private String materialSubGroupName;
    private String uom;
    private String hsnCode;
    private String brand;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MaterialMasterDto fromEntity(MaterialMaster e) {
        MaterialMasterDto d = new MaterialMasterDto();
        d.id = e.getId();
        d.name = e.getName();
        d.description = e.getDescription();
        if (e.getMaterialGroup() != null) {
            d.materialGroupId = e.getMaterialGroup().getId();
            d.materialGroupName = e.getMaterialGroup().getName();
        }
        if (e.getMaterialSubGroup() != null) {
            d.materialSubGroupId = e.getMaterialSubGroup().getId();
            d.materialSubGroupName = e.getMaterialSubGroup().getName();
        }
        d.uom = e.getUom();
        d.hsnCode = e.getHsnCode();
        d.brand = e.getBrand();
        d.active = e.isActive();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getMaterialGroupId() { return materialGroupId; }
    public void setMaterialGroupId(Long materialGroupId) { this.materialGroupId = materialGroupId; }
    public String getMaterialGroupName() { return materialGroupName; }
    public void setMaterialGroupName(String materialGroupName) { this.materialGroupName = materialGroupName; }
    public Long getMaterialSubGroupId() { return materialSubGroupId; }
    public void setMaterialSubGroupId(Long materialSubGroupId) { this.materialSubGroupId = materialSubGroupId; }
    public String getMaterialSubGroupName() { return materialSubGroupName; }
    public void setMaterialSubGroupName(String materialSubGroupName) { this.materialSubGroupName = materialSubGroupName; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
