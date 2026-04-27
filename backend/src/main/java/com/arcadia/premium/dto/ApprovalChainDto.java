package com.arcadia.premium.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ApprovalChainDto {

    private Long id;
    private String name;
    private String submitterRoleName;
    private boolean active;
    private List<ApprovalChainStepDto> steps = new ArrayList<>();
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSubmitterRoleName() { return submitterRoleName; }
    public void setSubmitterRoleName(String submitterRoleName) { this.submitterRoleName = submitterRoleName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public List<ApprovalChainStepDto> getSteps() { return steps; }
    public void setSteps(List<ApprovalChainStepDto> steps) { this.steps = steps; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
