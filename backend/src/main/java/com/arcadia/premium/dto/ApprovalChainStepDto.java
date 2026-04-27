package com.arcadia.premium.dto;

public class ApprovalChainStepDto {

    private Long id;
    private int stepOrder;
    private String approverRoleName;
    private Long approverUserId;
    private String approverUserName;
    private boolean blocking;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public int getStepOrder() { return stepOrder; }
    public void setStepOrder(int stepOrder) { this.stepOrder = stepOrder; }
    public String getApproverRoleName() { return approverRoleName; }
    public void setApproverRoleName(String approverRoleName) { this.approverRoleName = approverRoleName; }
    public Long getApproverUserId() { return approverUserId; }
    public void setApproverUserId(Long approverUserId) { this.approverUserId = approverUserId; }
    public String getApproverUserName() { return approverUserName; }
    public void setApproverUserName(String approverUserName) { this.approverUserName = approverUserName; }
    public boolean isBlocking() { return blocking; }
    public void setBlocking(boolean blocking) { this.blocking = blocking; }
}
