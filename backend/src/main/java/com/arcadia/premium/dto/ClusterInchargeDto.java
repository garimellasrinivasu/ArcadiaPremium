package com.arcadia.premium.dto;

import com.arcadia.premium.model.ClusterIncharge;

import java.time.LocalDateTime;

public class ClusterInchargeDto {
    private Long id;
    private Integer clusterNumber;
    private String inchargeName;
    private String villaNumbers;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ClusterInchargeDto fromEntity(ClusterIncharge e) {
        ClusterInchargeDto d = new ClusterInchargeDto();
        d.id = e.getId();
        d.clusterNumber = e.getClusterNumber();
        d.inchargeName = e.getInchargeName();
        d.villaNumbers = e.getVillaNumbers();
        d.active = e.isActive();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getClusterNumber() { return clusterNumber; }
    public void setClusterNumber(Integer clusterNumber) { this.clusterNumber = clusterNumber; }
    public String getInchargeName() { return inchargeName; }
    public void setInchargeName(String inchargeName) { this.inchargeName = inchargeName; }
    public String getVillaNumbers() { return villaNumbers; }
    public void setVillaNumbers(String villaNumbers) { this.villaNumbers = villaNumbers; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
