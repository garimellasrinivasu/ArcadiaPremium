package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "site_attendance")
public class SiteAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate attendanceDate;

    @Column(nullable = false)
    private String siteName;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String imageBase64;

    @Column(nullable = false)
    private int totalWorkers;

    // Legacy fields kept for backward compatibility with old records
    @Column(nullable = false)
    private int maleCount;

    @Column(nullable = false)
    private int femaleCount;

    // New Mastri/Helper breakdown fields
    @Column(columnDefinition = "integer default 0")
    private int maleMastriCount;

    @Column(columnDefinition = "integer default 0")
    private int femaleMastriCount;

    @Column(columnDefinition = "integer default 0")
    private int maleHelperCount;

    @Column(columnDefinition = "integer default 0")
    private int femaleHelperCount;

    private String remarks;

    @Column(nullable = false)
    private String status; // PENDING, IN_APPROVAL, APPROVED, REJECTED

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    // Legacy single-approver field (kept for backward compatibility)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approver_id")
    private User approver;

    private String approverRemarks;
    private LocalDateTime approvedAt;

    // ---- Multi-level approval fields ----

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approval_chain_id")
    private ApprovalChain approvalChain;

    @Column(nullable = false)
    private int currentStepOrder = 0;  // 0 = not started, 1+ = which step is pending

    @Column(nullable = false)
    private int totalSteps = 0;  // total steps in the chain

    @OneToMany(mappedBy = "attendance", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("stepOrder ASC")
    private List<ApprovalStep> approvalSteps = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public SiteAttendance() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }
    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }
    public String getImageBase64() { return imageBase64; }
    public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
    public int getTotalWorkers() { return totalWorkers; }
    public void setTotalWorkers(int totalWorkers) { this.totalWorkers = totalWorkers; }
    public int getMaleCount() { return maleCount; }
    public void setMaleCount(int maleCount) { this.maleCount = maleCount; }
    public int getFemaleCount() { return femaleCount; }
    public void setFemaleCount(int femaleCount) { this.femaleCount = femaleCount; }
    public int getMaleMastriCount() { return maleMastriCount; }
    public void setMaleMastriCount(int maleMastriCount) { this.maleMastriCount = maleMastriCount; }
    public int getFemaleMastriCount() { return femaleMastriCount; }
    public void setFemaleMastriCount(int femaleMastriCount) { this.femaleMastriCount = femaleMastriCount; }
    public int getMaleHelperCount() { return maleHelperCount; }
    public void setMaleHelperCount(int maleHelperCount) { this.maleHelperCount = maleHelperCount; }
    public int getFemaleHelperCount() { return femaleHelperCount; }
    public void setFemaleHelperCount(int femaleHelperCount) { this.femaleHelperCount = femaleHelperCount; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }
    public User getApprover() { return approver; }
    public void setApprover(User approver) { this.approver = approver; }
    public String getApproverRemarks() { return approverRemarks; }
    public void setApproverRemarks(String approverRemarks) { this.approverRemarks = approverRemarks; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    public ApprovalChain getApprovalChain() { return approvalChain; }
    public void setApprovalChain(ApprovalChain approvalChain) { this.approvalChain = approvalChain; }
    public int getCurrentStepOrder() { return currentStepOrder; }
    public void setCurrentStepOrder(int currentStepOrder) { this.currentStepOrder = currentStepOrder; }
    public int getTotalSteps() { return totalSteps; }
    public void setTotalSteps(int totalSteps) { this.totalSteps = totalSteps; }
    public List<ApprovalStep> getApprovalSteps() { return approvalSteps; }
    public void setApprovalSteps(List<ApprovalStep> approvalSteps) { this.approvalSteps = approvalSteps; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
