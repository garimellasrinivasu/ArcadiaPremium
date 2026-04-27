package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CreateApprovalChainRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String submitterRoleName;

    @NotEmpty
    private List<StepRequest> steps;

    private boolean active = true;

    public static class StepRequest {
        @NotBlank
        private String approverRoleName;

        @NotNull
        private Long approverUserId;  // Specific user who approves this step

        private boolean blocking = true;

        public String getApproverRoleName() { return approverRoleName; }
        public void setApproverRoleName(String approverRoleName) { this.approverRoleName = approverRoleName; }
        public Long getApproverUserId() { return approverUserId; }
        public void setApproverUserId(Long approverUserId) { this.approverUserId = approverUserId; }
        public boolean isBlocking() { return blocking; }
        public void setBlocking(boolean blocking) { this.blocking = blocking; }
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSubmitterRoleName() { return submitterRoleName; }
    public void setSubmitterRoleName(String submitterRoleName) { this.submitterRoleName = submitterRoleName; }
    public List<StepRequest> getSteps() { return steps; }
    public void setSteps(List<StepRequest> steps) { this.steps = steps; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
