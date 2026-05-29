package com.arcadia.premium.dto;

import com.arcadia.premium.model.CostingStandardHead;

import java.time.LocalDateTime;

public class CostingStandardHeadDto {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String category;
    private boolean active;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CostingStandardHeadDto fromEntity(CostingStandardHead e) {
        CostingStandardHeadDto d = new CostingStandardHeadDto();
        d.id = e.getId();
        d.code = e.getCode();
        d.name = e.getName();
        d.description = e.getDescription();
        d.category = e.getCategory();
        d.active = e.isActive();
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
