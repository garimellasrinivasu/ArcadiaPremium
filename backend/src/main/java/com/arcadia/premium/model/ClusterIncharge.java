package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "cluster_incharges")
public class ClusterIncharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer clusterNumber;

    @Column(nullable = false)
    private String inchargeName;

    @Column(length = 2000)
    private String villaNumbers;

    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public ClusterIncharge() {}

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
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
