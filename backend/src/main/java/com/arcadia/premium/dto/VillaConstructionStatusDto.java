package com.arcadia.premium.dto;

import com.arcadia.premium.model.VillaConstructionStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

public class VillaConstructionStatusDto {

    private Long id;
    private String projectName;
    private Integer villaNumber;
    private String phase;
    private boolean activity1Done;
    private boolean activity2Done;
    private String incharge;
    private String plannedTargetDate;
    private String revisedPlannedDate;
    private Long delayInDays;
    private String actualCompletionDate;
    private String updatedAt;
    private String updatedBy;

    public static VillaConstructionStatusDto fromEntity(VillaConstructionStatus e) {
        VillaConstructionStatusDto d = new VillaConstructionStatusDto();
        d.id = e.getId();
        d.projectName = e.getProjectName();
        d.villaNumber = e.getVillaNumber();
        d.phase = e.getPhase();
        d.activity1Done = e.isActivity1Done();
        d.activity2Done = e.isActivity2Done();
        d.incharge = e.getIncharge();
        d.plannedTargetDate = e.getPlannedTargetDate() != null ? e.getPlannedTargetDate().toString() : null;
        d.revisedPlannedDate = e.getRevisedPlannedDate() != null ? e.getRevisedPlannedDate().toString() : null;
        if (e.getPlannedTargetDate() != null && e.getRevisedPlannedDate() != null) {
            d.delayInDays = ChronoUnit.DAYS.between(e.getPlannedTargetDate(), e.getRevisedPlannedDate());
        }
        d.actualCompletionDate = e.getActualCompletionDate() != null ? e.getActualCompletionDate().toString() : null;
        d.updatedAt = e.getUpdatedAt() != null
                ? e.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : null;
        d.updatedBy = e.getUpdatedBy();
        return d;
    }

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

    public String getPlannedTargetDate() { return plannedTargetDate; }
    public void setPlannedTargetDate(String plannedTargetDate) { this.plannedTargetDate = plannedTargetDate; }

    public String getRevisedPlannedDate() { return revisedPlannedDate; }
    public void setRevisedPlannedDate(String revisedPlannedDate) { this.revisedPlannedDate = revisedPlannedDate; }

    public Long getDelayInDays() { return delayInDays; }
    public void setDelayInDays(Long delayInDays) { this.delayInDays = delayInDays; }

    public String getActualCompletionDate() { return actualCompletionDate; }
    public void setActualCompletionDate(String actualCompletionDate) { this.actualCompletionDate = actualCompletionDate; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
