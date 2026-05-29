package com.arcadia.premium.service;

import com.arcadia.premium.dto.ExecutionTemplateDto;
import com.arcadia.premium.model.ExecutionTemplate;
import com.arcadia.premium.model.ExecutionTemplateTask;
import com.arcadia.premium.model.Project;
import com.arcadia.premium.repository.ExecutionTemplateRepository;
import com.arcadia.premium.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExecutionTemplateService {

    private final ExecutionTemplateRepository repo;
    private final ProjectRepository projectRepo;

    public ExecutionTemplateService(ExecutionTemplateRepository repo,
                                    ProjectRepository projectRepo) {
        this.repo = repo;
        this.projectRepo = projectRepo;
    }

    @Transactional
    public ExecutionTemplateDto create(Map<String, Object> req, String createdBy) {
        Long projectId = toLong(req.get("projectId"));

        ExecutionTemplate template = new ExecutionTemplate();
        String name = (String) req.get("name");
        if (name == null || name.isBlank()) {
            // Auto-generate name from project
            name = "Template";
            if (projectId != null) {
                try {
                    Project p = projectRepo.findById(projectId).orElse(null);
                    if (p != null) name = p.getName() + " - Template";
                } catch (Exception ignored) {}
            }
        }
        template.setName(name);
        template.setDescription((String) req.get("description"));
        template.setCreatedBy(createdBy);

        if (projectId != null) {
            Project project = projectRepo.findById(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
            template.setProject(project);
        }

        if (req.get("active") != null) {
            template.setActive((Boolean) req.get("active"));
        }

        // Parse tasks
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> taskMaps = (List<Map<String, Object>>) req.get("tasks");
        if (taskMaps != null) {
            int order = 0;
            for (Map<String, Object> tm : taskMaps) {
                ExecutionTemplateTask task = new ExecutionTemplateTask();
                task.setTemplate(template);
                task.setTaskName((String) tm.get("taskName"));
                task.setDescription((String) tm.get("description"));
                task.setSortOrder(tm.get("sortOrder") != null ? toInt(tm.get("sortOrder")) : order);
                task.setEstimatedDays(tm.get("estimatedDays") != null ? toInt(tm.get("estimatedDays")) : null);
                template.getTasks().add(task);
                order++;
            }
        }

        return ExecutionTemplateDto.fromEntity(repo.save(template));
    }

    public List<ExecutionTemplateDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(ExecutionTemplateDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ExecutionTemplateDto> getByProject(Long projectId) {
        return repo.findByProjectIdOrderByNameAsc(projectId).stream()
                .map(ExecutionTemplateDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ExecutionTemplateDto getById(Long id) {
        return repo.findById(id)
                .map(ExecutionTemplateDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Execution template not found: " + id));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
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
