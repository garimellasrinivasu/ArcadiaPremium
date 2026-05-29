package com.arcadia.premium.dto;

import com.arcadia.premium.model.ExecutionTemplateTask;

public class ExecutionTemplateTaskDto {

    private Long id;
    private String taskName;
    private String description;
    private Integer sortOrder;
    private Integer estimatedDays;

    public static ExecutionTemplateTaskDto fromEntity(ExecutionTemplateTask e) {
        ExecutionTemplateTaskDto d = new ExecutionTemplateTaskDto();
        d.id = e.getId();
        d.taskName = e.getTaskName();
        d.description = e.getDescription();
        d.sortOrder = e.getSortOrder();
        d.estimatedDays = e.getEstimatedDays();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getEstimatedDays() { return estimatedDays; }
    public void setEstimatedDays(Integer estimatedDays) { this.estimatedDays = estimatedDays; }
}
