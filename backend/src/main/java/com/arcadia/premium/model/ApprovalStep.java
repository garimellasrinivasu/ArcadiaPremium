package com.arcadia.premium.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Tracks the actual approval action taken at each step of the chain
 * for a specific SiteAttendance record.
 */
@Entity
@Table(name = "approval_steps")
public class ApprovalStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_id", nullable = false)
    @JsonIgnore
    private SiteAttendance attendance;

    @Column(nullable = false)
    private int stepOrder;

    @Column(nullable = false)
    private String approverRoleName;  // Which role was expected to approve

    /**
     * The specific user ASSIGNED to approve this step (from chain configuration).
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    /**
     * The actual user who approved/rejected (may be same as assignedTo).
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "acted_by")
    private User actedBy;

    @Column(nullable = false)
    private String status;  // PENDING, APPROVED, REJECTED

    private String remarks;

    private LocalDateTime actionAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public ApprovalStep() {}

    public ApprovalStep(SiteAttendance attendance, int stepOrder, String approverRoleName, User assignedTo) {
        this.attendance = attendance;
        this.stepOrder = stepOrder;
        this.approverRoleName = approverRoleName;
        this.assignedTo = assignedTo;
        this.status = "PENDING";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public SiteAttendance getAttendance() { return attendance; }
    public void setAttendance(SiteAttendance attendance) { this.attendance = attendance; }
    public int getStepOrder() { return stepOrder; }
    public void setStepOrder(int stepOrder) { this.stepOrder = stepOrder; }
    public String getApproverRoleName() { return approverRoleName; }
    public void setApproverRoleName(String approverRoleName) { this.approverRoleName = approverRoleName; }
    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }
    public User getActedBy() { return actedBy; }
    public void setActedBy(User actedBy) { this.actedBy = actedBy; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public LocalDateTime getActionAt() { return actionAt; }
    public void setActionAt(LocalDateTime actionAt) { this.actionAt = actionAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
