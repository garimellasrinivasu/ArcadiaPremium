package com.arcadia.premium.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "approval_chain_steps")
public class ApprovalChainStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chain_id", nullable = false)
    @JsonIgnore
    private ApprovalChain approvalChain;

    @Column(nullable = false)
    private int stepOrder;  // 1, 2, 3...

    @Column(nullable = false)
    private String approverRoleName;  // "ENGINEERING", "PARTNER", "ACCOUNTING"

    /**
     * Specific user assigned to approve this step.
     * When configured, ONLY this user can approve (not any user with the role).
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approver_user_id")
    private User approverUser;

    @Column(nullable = false)
    private boolean blocking = true;  // false for ACCOUNTING (recording only)

    public ApprovalChainStep() {}

    public ApprovalChainStep(ApprovalChain chain, int stepOrder, String approverRoleName, boolean blocking) {
        this.approvalChain = chain;
        this.stepOrder = stepOrder;
        this.approverRoleName = approverRoleName;
        this.blocking = blocking;
    }

    public ApprovalChainStep(ApprovalChain chain, int stepOrder, String approverRoleName,
                              User approverUser, boolean blocking) {
        this.approvalChain = chain;
        this.stepOrder = stepOrder;
        this.approverRoleName = approverRoleName;
        this.approverUser = approverUser;
        this.blocking = blocking;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ApprovalChain getApprovalChain() { return approvalChain; }
    public void setApprovalChain(ApprovalChain approvalChain) { this.approvalChain = approvalChain; }
    public int getStepOrder() { return stepOrder; }
    public void setStepOrder(int stepOrder) { this.stepOrder = stepOrder; }
    public String getApproverRoleName() { return approverRoleName; }
    public void setApproverRoleName(String approverRoleName) { this.approverRoleName = approverRoleName; }
    public User getApproverUser() { return approverUser; }
    public void setApproverUser(User approverUser) { this.approverUser = approverUser; }
    public boolean isBlocking() { return blocking; }
    public void setBlocking(boolean blocking) { this.blocking = blocking; }
}
