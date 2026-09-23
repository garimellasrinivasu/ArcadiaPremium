package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "villa_incharge_log")
public class VillaInchargeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "villa_number", nullable = false)
    private Integer villaNumber;

    @Column(nullable = false)
    private String phase;

    @Column(name = "old_incharge")
    private String oldIncharge;

    @Column(name = "new_incharge")
    private String newIncharge;

    @Column(name = "changed_by")
    private String changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    public VillaInchargeLog() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public Integer getVillaNumber() { return villaNumber; }
    public void setVillaNumber(Integer villaNumber) { this.villaNumber = villaNumber; }

    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }

    public String getOldIncharge() { return oldIncharge; }
    public void setOldIncharge(String oldIncharge) { this.oldIncharge = oldIncharge; }

    public String getNewIncharge() { return newIncharge; }
    public void setNewIncharge(String newIncharge) { this.newIncharge = newIncharge; }

    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
}
