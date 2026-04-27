package com.arcadia.premium.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SiteAttendanceDto {

    private Long id;
    private LocalDate attendanceDate;
    private String siteName;
    private String imageBase64;
    private int totalWorkers;
    private int maleCount;
    private int femaleCount;
    private String remarks;
    private String status;
    private Long submittedById;
    private String submittedByName;

    // Legacy single-approver fields
    private Long approverId;
    private String approverName;
    private String approverRemarks;
    private LocalDateTime approvedAt;

    // Multi-level approval fields
    private Long approvalChainId;
    private String approvalChainName;
    private int currentStepOrder;
    private int totalSteps;
    private String currentStepRoleName;  // which role needs to approve now
    private List<ApprovalStepDto> approvalSteps = new ArrayList<>();

    private LocalDateTime createdAt;

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
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getSubmittedById() { return submittedById; }
    public void setSubmittedById(Long submittedById) { this.submittedById = submittedById; }
    public String getSubmittedByName() { return submittedByName; }
    public void setSubmittedByName(String submittedByName) { this.submittedByName = submittedByName; }
    public Long getApproverId() { return approverId; }
    public void setApproverId(Long approverId) { this.approverId = approverId; }
    public String getApproverName() { return approverName; }
    public void setApproverName(String approverName) { this.approverName = approverName; }
    public String getApproverRemarks() { return approverRemarks; }
    public void setApproverRemarks(String approverRemarks) { this.approverRemarks = approverRemarks; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    public Long getApprovalChainId() { return approvalChainId; }
    public void setApprovalChainId(Long approvalChainId) { this.approvalChainId = approvalChainId; }
    public String getApprovalChainName() { return approvalChainName; }
    public void setApprovalChainName(String approvalChainName) { this.approvalChainName = approvalChainName; }
    public int getCurrentStepOrder() { return currentStepOrder; }
    public void setCurrentStepOrder(int currentStepOrder) { this.currentStepOrder = currentStepOrder; }
    public int getTotalSteps() { return totalSteps; }
    public void setTotalSteps(int totalSteps) { this.totalSteps = totalSteps; }
    public String getCurrentStepRoleName() { return currentStepRoleName; }
    public void setCurrentStepRoleName(String currentStepRoleName) { this.currentStepRoleName = currentStepRoleName; }
    public List<ApprovalStepDto> getApprovalSteps() { return approvalSteps; }
    public void setApprovalSteps(List<ApprovalStepDto> approvalSteps) { this.approvalSteps = approvalSteps; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
