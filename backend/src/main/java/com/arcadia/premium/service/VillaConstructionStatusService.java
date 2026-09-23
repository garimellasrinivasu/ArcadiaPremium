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
            entity.setActivity1Done(!entity.isActivity1Done());
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
            entity.setActivity1Done(done);
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
        entity.setPlannedTargetDate(plannedTargetDate != null && !plannedTargetDate.isEmpty()
                ? LocalDate.parse(plannedTargetDate) : null);
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

            entity.setActivity1Done(dto.isActivity1Done());
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
}
