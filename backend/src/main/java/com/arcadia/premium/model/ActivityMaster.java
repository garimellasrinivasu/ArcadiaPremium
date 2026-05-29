package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_master")
public class ActivityMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_group_id", nullable = false)
    private ActivityGroup activityGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_sub_group_id")
    private ActivitySubGroup activitySubGroup;

    /** Unit of Measurement: Sqm, Rmt, Cum, Nos, Kg, etc. */
    @Column(nullable = false)
    private String uom;

    /** SAC / HSN Code for GST */
    private String sacCode;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public ActivityMaster() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ActivityGroup getActivityGroup() { return activityGroup; }
    public void setActivityGroup(ActivityGroup activityGroup) { this.activityGroup = activityGroup; }
    public ActivitySubGroup getActivitySubGroup() { return activitySubGroup; }
    public void setActivitySubGroup(ActivitySubGroup activitySubGroup) { this.activitySubGroup = activitySubGroup; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public String getSacCode() { return sacCode; }
    public void setSacCode(String sacCode) { this.sacCode = sacCode; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
