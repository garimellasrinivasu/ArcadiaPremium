package com.arcadia.premium.service;

import com.arcadia.premium.dto.ExecutionTaskDto;
import com.arcadia.premium.model.ExecutionTask;
import com.arcadia.premium.model.ExecutionTemplate;
import com.arcadia.premium.model.ExecutionTemplateTask;
import com.arcadia.premium.model.Project;
import com.arcadia.premium.repository.ExecutionTaskRepository;
import com.arcadia.premium.repository.ExecutionTemplateRepository;
import com.arcadia.premium.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExecutionTaskService {

    private final ExecutionTaskRepository repo;
    private final ExecutionTemplateRepository templateRepo;
    private final ProjectRepository projectRepo;

    public ExecutionTaskService(ExecutionTaskRepository repo,
                                ExecutionTemplateRepository templateRepo,
                                ProjectRepository projectRepo) {
        this.repo = repo;
        this.templateRepo = templateRepo;
        this.projectRepo = projectRepo;
    }

    /**
     * Allocate tasks from a template to a specific unit/block and assignee.
     * Creates one ExecutionTask per template task.
     */
    @Transactional
    public List<ExecutionTaskDto> allocateFromTemplate(Map<String, Object> req, String createdBy) {
        Long templateId = toLong(req.get("templateId"));
        String unitOrBlock = (String) req.get("unitOrBlock");
        String assignedTo = (String) req.get("assignedTo");
        LocalDate startDate = req.get("startDate") != null ? LocalDate.parse((String) req.get("startDate")) : null;
        LocalDate targetDate = req.get("targetDate") != null ? LocalDate.parse((String) req.get("targetDate")) : null;

        ExecutionTemplate template = templateRepo.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Execution template not found: " + templateId));

        List<ExecutionTask> tasks = new ArrayList<>();
        for (ExecutionTemplateTask tt : template.getTasks()) {
            ExecutionTask task = new ExecutionTask();
            task.setTaskCode(generateTaskCode());
            task.setProject(template.getProject());
            task.setUnitOrBlock(unitOrBlock);
            task.setTaskName(tt.getTaskName());
            task.setDescription(tt.getDescription());
            task.setAssignedTo(assignedTo);
            task.setStatus("PENDING");
            task.setCompletionPercentage(0);
            task.setStartDate(startDate);
            task.setTargetDate(targetDate);
            task.setCreatedBy(createdBy);
            tasks.add(repo.save(task));
        }

        return tasks.stream()
                .map(ExecutionTaskDto::fromEntity)
                .collect(Collectors.toList());
    }

    /** Create a single ad-hoc execution task. */
    @Transactional
    public ExecutionTaskDto createSingle(Map<String, Object> req, String createdBy) {
        Long projectId = toLong(req.get("projectId"));

        ExecutionTask task = new ExecutionTask();
        task.setTaskCode(generateTaskCode());
        task.setTaskName((String) req.get("taskName"));
        task.setDescription((String) req.get("description"));
        task.setUnitOrBlock((String) req.get("unitOrBlock"));
        task.setAssignedTo((String) req.get("assignedTo"));
        task.setStatus("PENDING");
        task.setCompletionPercentage(0);
        task.setRemarks((String) req.get("remarks"));
        task.setCreatedBy(createdBy);

        if (projectId != null) {
            Project project = projectRepo.findById(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
            task.setProject(project);
        }

        if (req.get("startDate") != null) {
            task.setStartDate(LocalDate.parse((String) req.get("startDate")));
        }
        if (req.get("targetDate") != null) {
            task.setTargetDate(LocalDate.parse((String) req.get("targetDate")));
        }

        return ExecutionTaskDto.fromEntity(repo.save(task));
    }

    public List<ExecutionTaskDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(ExecutionTaskDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ExecutionTaskDto> getByProject(Long projectId) {
        return repo.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(ExecutionTaskDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ExecutionTaskDto> getByAssignee(String username) {
        return repo.findByAssignedToOrderByCreatedAtDesc(username).stream()
                .map(ExecutionTaskDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ExecutionTaskDto getById(Long id) {
        return repo.findById(id)
                .map(ExecutionTaskDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Execution task not found: " + id));
    }

    @Transactional
    public ExecutionTaskDto updateStatus(Long id, String status) {
        ExecutionTask task = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Execution task not found: " + id));
        task.setStatus(status);
        if ("IN_PROGRESS".equals(status) && task.getStartDate() == null) {
            task.setStartDate(LocalDate.now());
        }
        if ("COMPLETED".equals(status)) {
            task.setCompletionPercentage(100);
            task.setCompletedDate(LocalDate.now());
        }
        return ExecutionTaskDto.fromEntity(repo.save(task));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    /** Generate next task code: TASK-001, TASK-002, etc. */
    public synchronized String generateTaskCode() {
        String maxCode = repo.findMaxTaskCode().orElse(null);
        int next = 1;
        if (maxCode != null && maxCode.startsWith("TASK-")) {
            try {
                next = Integer.parseInt(maxCode.substring(5)) + 1;
            } catch (NumberFormatException ignored) {
            }
        }
        return String.format("TASK-%03d", next);
    }

    // ── Helpers ──

    private Long toLong(Object val) {
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).longValue();
        return Long.parseLong(val.toString());
    }
}
