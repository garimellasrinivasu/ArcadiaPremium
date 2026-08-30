package com.arcadia.premium.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "villa_construction_status",
       uniqueConstraints = @UniqueConstraint(columnNames = {"project_name", "villa_number", "phase"}))
public class VillaConstructionStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "villa_number", nullable = false)
    private Integer villaNumber;

    @Column(nullable = false)
    private String phase; // EXCAVATION, PCC_PUTTINGS, NECK_COLUMNS, PLINTH_BEAM, BACK_FILLING_COMPACTION, COLUMNS, GROUND_FLOOR_SLAB, FIRST_FLOOR_SLAB, SECOND_FLOOR_SLAB

    @Column(name = "activity1_done", nullable = false)
    private boolean activity1Done = false;

    @Column(name = "activity2_done", nullable = false)
    private boolean activity2Done = false;

    @Column
    private String incharge;

    @Column(name = "planned_target_date")
    private LocalDate plannedTargetDate;

    @Column(name = "revised_planned_date")
    private LocalDate revisedPlannedDate;

    @Column(name = "actual_completion_date")
    private LocalDate actualCompletionDate;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private String updatedBy;

    // Constructors
    public VillaConstructionStatus() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public Integer getVillaNumber() { return villaNumber; }
    public void setVillaNumber(Integer villaNumber) { this.villaNumber = villaNumber; }

    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }

    public boolean isActivity1Done() { return activity1Done; }
    public void setActivity1Done(boolean activity1Done) { this.activity1Done = activity1Done; }

    public boolean isActivity2Done() { return activity2Done; }
    public void setActivity2Done(boolean activity2Done) { this.activity2Done = activity2Done; }

    public String getIncharge() { return incharge; }
    public void setIncharge(String incharge) { this.incharge = incharge; }

    public LocalDate getPlannedTargetDate() { return plannedTargetDate; }
    public void setPlannedTargetDate(LocalDate plannedTargetDate) { this.plannedTargetDate = plannedTargetDate; }

    public LocalDate getRevisedPlannedDate() { return revisedPlannedDate; }
    public void setRevisedPlannedDate(LocalDate revisedPlannedDate) { this.revisedPlannedDate = revisedPlannedDate; }

    public LocalDate getActualCompletionDate() { return actualCompletionDate; }
    public void setActualCompletionDate(LocalDate actualCompletionDate) { this.actualCompletionDate = actualCompletionDate; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
