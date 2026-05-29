package com.arcadia.premium.model;

import jakarta.persistence.*;

@Entity
@Table(name = "execution_template_tasks")
public class ExecutionTemplateTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private ExecutionTemplate template;

    @Column(nullable = false)
    private String taskName;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private Integer sortOrder = 0;

    private Integer estimatedDays;

    public ExecutionTemplateTask() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ExecutionTemplate getTemplate() { return template; }
    public void setTemplate(ExecutionTemplate template) { this.template = template; }
    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getEstimatedDays() { return estimatedDays; }
    public void setEstimatedDays(Integer estimatedDays) { this.estimatedDays = estimatedDays; }
}
