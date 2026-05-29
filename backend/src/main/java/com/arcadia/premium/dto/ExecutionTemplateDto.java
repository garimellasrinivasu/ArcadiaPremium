package com.arcadia.premium.dto;

import com.arcadia.premium.model.ExecutionTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ExecutionTemplateDto {

    private Long id;
    private String name;
    private String description;
    private Long projectId;
    private String projectName;
    private boolean active;
    private List<ExecutionTemplateTaskDto> tasks = new ArrayList<>();
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ExecutionTemplateDto fromEntity(ExecutionTemplate e) {
        ExecutionTemplateDto d = new ExecutionTemplateDto();
        d.id = e.getId();
        d.name = e.getName();
        d.description = e.getDescription();
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        d.active = e.isActive();
        if (e.getTasks() != null) {
            d.tasks = e.getTasks().stream()
                    .map(ExecutionTemplateTaskDto::fromEntity)
                    .collect(Collectors.toList());
        }
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public List<ExecutionTemplateTaskDto> getTasks() { return tasks; }
    public void setTasks(List<ExecutionTemplateTaskDto> tasks) { this.tasks = tasks; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
