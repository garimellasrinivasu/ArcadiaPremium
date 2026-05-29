package com.arcadia.premium.service;

import com.arcadia.premium.dto.DailyExecutionUpdateDto;
import com.arcadia.premium.model.DailyExecutionUpdate;
import com.arcadia.premium.model.ExecutionTask;
import com.arcadia.premium.repository.DailyExecutionUpdateRepository;
import com.arcadia.premium.repository.ExecutionTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DailyExecutionUpdateService {

    private final DailyExecutionUpdateRepository repo;
    private final ExecutionTaskRepository taskRepo;

    public DailyExecutionUpdateService(DailyExecutionUpdateRepository repo,
                                        ExecutionTaskRepository taskRepo) {
        this.repo = repo;
        this.taskRepo = taskRepo;
    }

    /**
     * Record a daily progress update for an execution task.
     * - Captures previous percentage
     * - Updates the task's completionPercentage
     * - If newPercentage == 100, auto-sets status to COMPLETED and completedDate to today
     * - If task was PENDING and newPercentage > 0, auto-sets status to IN_PROGRESS
     */
    @Transactional
    public DailyExecutionUpdateDto recordUpdate(Map<String, Object> req, String updatedBy) {
        Long executionTaskId = toLong(req.get("executionTaskId"));
        Integer newPercentage = toInt(req.get("newPercentage"));
        String remarks = (String) req.get("remarks");

        ExecutionTask task = taskRepo.findById(executionTaskId)
                .orElseThrow(() -> new RuntimeException("Execution task not found: " + executionTaskId));

        DailyExecutionUpdate update = new DailyExecutionUpdate();
        update.setExecutionTask(task);
        update.setUpdateDate(LocalDate.now());
        update.setPreviousPercentage(task.getCompletionPercentage());
        update.setNewPercentage(newPercentage);
        update.setRemarks(remarks);
        update.setUpdatedBy(updatedBy);

        // Update the task
        task.setCompletionPercentage(newPercentage);

        if (newPercentage == 100) {
            task.setStatus("COMPLETED");
            task.setCompletedDate(LocalDate.now());
        } else if ("PENDING".equals(task.getStatus()) && newPercentage > 0) {
            task.setStatus("IN_PROGRESS");
        }

        taskRepo.save(task);
        return DailyExecutionUpdateDto.fromEntity(repo.save(update));
    }

    public List<DailyExecutionUpdateDto> getByTask(Long taskId) {
        return repo.findByExecutionTaskIdOrderByUpdateDateDesc(taskId).stream()
                .map(DailyExecutionUpdateDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<DailyExecutionUpdateDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(DailyExecutionUpdateDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ── Helpers ──

    private Long toLong(Object val) {
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).longValue();
        return Long.parseLong(val.toString());
    }

    private int toInt(Object val) {
        if (val instanceof Number) return ((Number) val).intValue();
        return Integer.parseInt(val.toString());
    }
}
