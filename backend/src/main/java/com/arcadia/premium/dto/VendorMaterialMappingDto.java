package com.arcadia.premium.dto;

import com.arcadia.premium.model.VendorMaterialMapping;

import java.time.LocalDateTime;

public class VendorMaterialMappingDto {
    private Long id;
    private Long vendorId;
    private String vendorName;
    private Long materialId;
    private String materialName;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VendorMaterialMappingDto fromEntity(VendorMaterialMapping e) {
        VendorMaterialMappingDto d = new VendorMaterialMappingDto();
        d.id = e.getId();
        if (e.getVendor() != null) {
            d.vendorId = e.getVendor().getId();
            d.vendorName = e.getVendor().getName();
        }
        if (e.getMaterial() != null) {
            d.materialId = e.getMaterial().getId();
            d.materialName = e.getMaterial().getName();
        }
        d.active = e.isActive();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }
    public String getMaterialName() { return materialName; }
    public void setMaterialName(String materialName) { this.materialName = materialName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
