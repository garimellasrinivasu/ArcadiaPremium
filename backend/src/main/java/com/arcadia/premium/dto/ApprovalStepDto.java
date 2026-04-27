package com.arcadia.premium.dto;

import java.time.LocalDateTime;

public class ApprovalStepDto {

    private Long id;
    private int stepOrder;
    private String approverRoleName;
    private String status;  // PENDING, APPROVED, REJECTED

    // Who is ASSIGNED to approve this step
    private Long assignedToId;
    private String assignedToName;

    // Who actually acted (after approval/rejection)
    private Long actedById;
    private String actedByName;

    private String remarks;
    private LocalDateTime actionAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public int getStepOrder() { return stepOrder; }
    public void setStepOrder(int stepOrder) { this.stepOrder = stepOrder; }
    public String getApproverRoleName() { return approverRoleName; }
    public void setApproverRoleName(String approverRoleName) { this.approverRoleName = approverRoleName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }
    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }
    public Long getActedById() { return actedById; }
    public void setActedById(Long actedById) { this.actedById = actedById; }
    public String getActedByName() { return actedByName; }
    public void setActedByName(String actedByName) { this.actedByName = actedByName; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public LocalDateTime getActionAt() { return actionAt; }
    public void setActionAt(LocalDateTime actionAt) { this.actionAt = actionAt; }
}
