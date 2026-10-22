package com.arcadia.premium.service;

import com.arcadia.premium.dto.VillaConstructionStatusDto;
import com.arcadia.premium.model.VillaConstructionStatus;
import com.arcadia.premium.model.VillaInchargeLog;
import com.arcadia.premium.repository.VillaConstructionStatusRepository;
import com.arcadia.premium.repository.VillaInchargeLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VillaConstructionStatusService {

    private static final java.time.ZoneId IST = java.time.ZoneId.of("Asia/Kolkata");

    private static final Logger log = LoggerFactory.getLogger(VillaConstructionStatusService.class);

    private final VillaConstructionStatusRepository repository;
    private final VillaInchargeLogRepository inchargeLogRepository;

    public VillaConstructionStatusService(VillaConstructionStatusRepository repository,
                                          VillaInchargeLogRepository inchargeLogRepository) {
        this.repository = repository;
        this.inchargeLogRepository = inchargeLogRepository;
    }

    public List<VillaConstructionStatusDto> getAllByProject(String projectName) {
        return repository.findByProjectName(projectName).stream()
                .map(VillaConstructionStatusDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<VillaConstructionStatusDto> getByProjectAndPhase(String projectName, String phase) {
        return repository.findByProjectNameAndPhase(projectName, phase).stream()
                .map(VillaConstructionStatusDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public VillaConstructionStatusDto toggleStatus(String projectName, Integer villaNumber,
                                                    String phase, int activityIndex) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        VillaConstructionStatus entity = repository
                .findByProjectNameAndVillaNumberAndPhase(projectName, villaNumber, phase)
                .orElseGet(() -> {
                    VillaConstructionStatus newEntity = new VillaConstructionStatus();
                    newEntity.setProjectName(projectName);
                    newEntity.setVillaNumber(villaNumber);
                    newEntity.setPhase(phase);
                    return newEntity;
                });

        if (activityIndex == 1) {
            setActivity1Done(entity, !entity.isActivity1Done());
        } else if (activityIndex == 2) {
            entity.setActivity2Done(!entity.isActivity2Done());
        } else {
            throw new IllegalArgumentException("activityIndex must be 1 or 2, got: " + activityIndex);
        }

        entity.setUpdatedAt(LocalDateTime.now());
        entity.setUpdatedBy(username);
        entity = repository.save(entity);

        log.info("Toggled construction status: project={}, villa={}, phase={}, activity{} -> {} by {}",
                projectName, villaNumber, phase, activityIndex,
                activityIndex == 1 ? entity.isActivity1Done() : entity.isActivity2Done(),
                username);

        return VillaConstructionStatusDto.fromEntity(entity);
    }

    @Transactional
    public VillaConstructionStatusDto updateDetails(String projectName, Integer villaNumber,
                                                      String phase, int activityIndex,
                                                      boolean done, String incharge,
                                                      String plannedTargetDate, String revisedPlannedDate,
                                                      String actualCompletionDate) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        VillaConstructionStatus entity = repository
                .findByProjectNameAndVillaNumberAndPhase(projectName, villaNumber, phase)
                .orElseGet(() -> {
                    VillaConstructionStatus newEntity = new VillaConstructionStatus();
                    newEntity.setProjectName(projectName);
                    newEntity.setVillaNumber(villaNumber);
                    newEntity.setPhase(phase);
                    return newEntity;
                });

        if (activityIndex == 1) {
            setActivity1Done(entity, done);
        } else if (activityIndex == 2) {
            entity.setActivity2Done(done);
        }

        // Log incharge change if different
        String oldIncharge = entity.getIncharge();
        String newIncharge = incharge;
        boolean inchargeChanged = (oldIncharge == null && newIncharge != null && !newIncharge.isEmpty())
                || (oldIncharge != null && !oldIncharge.equals(newIncharge != null ? newIncharge : ""));
        if (inchargeChanged) {
            VillaInchargeLog logEntry = new VillaInchargeLog();
            logEntry.setProjectName(projectName);
            logEntry.setVillaNumber(villaNumber);
            logEntry.setPhase(phase);
            logEntry.setOldIncharge(oldIncharge != null ? oldIncharge : "");
            logEntry.setNewIncharge(newIncharge != null ? newIncharge : "");
            logEntry.setChangedBy(username);
            logEntry.setChangedAt(LocalDateTime.now());
            inchargeLogRepository.save(logEntry);
            log.info("Incharge changed: project={}, villa={}, phase={}, '{}' -> '{}' by {}",
                    projectName, villaNumber, phase, oldIncharge, newIncharge, username);
        }

        entity.setIncharge(incharge);
        LocalDate newPlanned = plannedTargetDate != null && !plannedTargetDate.isEmpty() ? LocalDate.parse(plannedTargetDate) : null;
        if (!java.util.Objects.equals(newPlanned, entity.getPlannedTargetDate())) entity.setPlannedDateDefaulted(false);
        entity.setPlannedTargetDate(newPlanned);
        entity.setRevisedPlannedDate(revisedPlannedDate != null && !revisedPlannedDate.isEmpty()
                ? LocalDate.parse(revisedPlannedDate) : null);
        entity.setActualCompletionDate(actualCompletionDate != null && !actualCompletionDate.isEmpty()
                ? LocalDate.parse(actualCompletionDate) : null);
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setUpdatedBy(username);
        entity = repository.save(entity);

        log.info("Updated construction details: project={}, villa={}, phase={}, activity{} done={} by {}",
                projectName, villaNumber, phase, activityIndex, done, username);

        return VillaConstructionStatusDto.fromEntity(entity);
    }

    @Transactional
    public List<VillaConstructionStatusDto> bulkUpdate(String projectName, String phase,
                                                       List<VillaConstructionStatusDto> dtos) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        List<VillaConstructionStatus> results = dtos.stream().map(dto -> {
            VillaConstructionStatus entity = repository
                    .findByProjectNameAndVillaNumberAndPhase(projectName, dto.getVillaNumber(), phase)
                    .orElseGet(() -> {
                        VillaConstructionStatus newEntity = new VillaConstructionStatus();
                        newEntity.setProjectName(projectName);
                        newEntity.setVillaNumber(dto.getVillaNumber());
                        newEntity.setPhase(phase);
                        return newEntity;
                    });

            setActivity1Done(entity, dto.isActivity1Done());
            entity.setActivity2Done(dto.isActivity2Done());
            entity.setUpdatedAt(LocalDateTime.now());
            entity.setUpdatedBy(username);
            return repository.save(entity);
        }).collect(Collectors.toList());

        log.info("Bulk updated {} construction status records for project={}, phase={} by {}",
                results.size(), projectName, phase, username);

        return results.stream()
                .map(VillaConstructionStatusDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ── Import of planned dates / completed stages (from the cluster schedule Excel) ──

    public static final java.util.Set<String> PHASE_KEYS = java.util.Set.of(
            "EXCAVATION", "PCC", "FOOTINGS", "NECK_COLUMNS", "BACK_FILLING_COMPACTION", "PLINTH_BEAM", "COLUMNS",
            "GROUND_FLOOR_SLAB", "FIRST_FLOOR_COLUMNS", "FIRST_FLOOR_SLAB", "SECOND_FLOOR_COLUMNS", "SECOND_FLOOR_SLAB");

    /**
     * Each cell is a villa + phase + value: "COMPLETED", a date (yyyy-MM-dd) or "" (no information).
     * COMPLETED marks the stage done (no completion date); a date becomes the planned target date;
     * "" gives a stage that is not done and has no planned date today's date, flagged as not updated.
     * Stages already marked done are never un-marked. With dryRun nothing is saved.
     */
    @Transactional
    public java.util.Map<String, Object> importSchedule(String projectName, List<java.util.Map<String, Object>> cells, boolean dryRun) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        LocalDate today = LocalDate.now(IST);
        java.util.Map<String, VillaConstructionStatus> existing = new java.util.HashMap<>();
        for (VillaConstructionStatus e : repository.findByProjectName(projectName)) existing.put(e.getVillaNumber() + "|" + e.getPhase(), e);

        int markedDone = 0, datesSet = 0, defaulted = 0, unchanged = 0;
        List<String> warnings = new java.util.ArrayList<>();
        List<VillaConstructionStatus> toSave = new java.util.ArrayList<>();
        for (java.util.Map<String, Object> c : cells) {
            int villa = ((Number) c.get("villa")).intValue();
            String phase = String.valueOf(c.get("phase"));
            if (!PHASE_KEYS.contains(phase)) throw new IllegalArgumentException("Unknown stage: " + phase);
            String value = c.get("value") == null ? "" : String.valueOf(c.get("value")).trim();
            VillaConstructionStatus e = existing.get(villa + "|" + phase);
            boolean isNew = e == null;
            if (isNew) {
                e = new VillaConstructionStatus();
                e.setProjectName(projectName);
                e.setVillaNumber(villa);
                e.setPhase(phase);
            }
            boolean changed = false;
            if ("COMPLETED".equalsIgnoreCase(value)) {
                if (!e.isActivity1Done()) { e.setActivity1Done(true); e.setCompletionImported(true); markedDone++; changed = true; }
            } else if (!value.isEmpty()) {
                LocalDate d = LocalDate.parse(value);
                if (!d.equals(e.getPlannedTargetDate()) || e.isPlannedDateDefaulted()) {
                    e.setPlannedTargetDate(d);
                    e.setPlannedDateDefaulted(false);
                    datesSet++; changed = true;
                }
                if (e.isActivity1Done()) warnings.add("Villa " + villa + " " + phase + ": already marked done here; the plan gives " + d + " (kept as done)");
            } else if (!e.isActivity1Done() && e.getPlannedTargetDate() == null) {
                e.setPlannedTargetDate(today);
                e.setPlannedDateDefaulted(true);
                defaulted++; changed = true;
            }
            if (!changed) { unchanged++; continue; }
            e.setUpdatedAt(LocalDateTime.now(IST));
            e.setUpdatedBy(username);
            toSave.add(e);
            if (isNew) existing.put(villa + "|" + phase, e);
        }
        if (dryRun) {
            // loaded rows were changed in memory — make sure a preview writes nothing
            org.springframework.transaction.interceptor.TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        } else {
            repository.saveAll(toSave);
        }
        log.info("Schedule import for {} by {}: done={}, dates={}, defaulted={}, unchanged={}, dryRun={}",
                projectName, username, markedDone, datesSet, defaulted, unchanged, dryRun);
        java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("dryRun", dryRun);
        out.put("markedDone", markedDone);
        out.put("datesSet", datesSet);
        out.put("defaulted", defaulted);
        out.put("unchanged", unchanged);
        out.put("warnings", warnings);
        return out;
    }

    /** Sets activity 1 and records when it became done, for the daily report. */
    private static void setActivity1Done(VillaConstructionStatus entity, boolean done) {
        if (done && !entity.isActivity1Done()) {
            entity.setCompletedAt(LocalDateTime.now(IST));
            entity.setCompletionImported(false);
        } else if (!done) {
            entity.setCompletedAt(null);
            entity.setCompletionImported(false);
        }
        entity.setActivity1Done(done);
    }
}
