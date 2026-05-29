package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "map_cost_heads")
public class MapCostHead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private ActivityMaster activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "standard_head_id", nullable = false)
    private CostingStandardHead standardHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "custom_head_id")
    private CostingCustomHead customHead;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public MapCostHead() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Job getJob() { return job; }
    public void setJob(Job job) { this.job = job; }
    public ActivityMaster getActivity() { return activity; }
    public void setActivity(ActivityMaster activity) { this.activity = activity; }
    public CostingStandardHead getStandardHead() { return standardHead; }
    public void setStandardHead(CostingStandardHead standardHead) { this.standardHead = standardHead; }
    public CostingCustomHead getCustomHead() { return customHead; }
    public void setCustomHead(CostingCustomHead customHead) { this.customHead = customHead; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
