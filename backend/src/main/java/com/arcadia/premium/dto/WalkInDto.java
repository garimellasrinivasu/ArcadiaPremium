package com.arcadia.premium.dto;

import com.arcadia.premium.model.WalkIn;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class WalkInDto {
    private Long id;
    private LocalDate visitDate;
    private String visitorName;
    private String phone;
    private String email;
    private String source;
    private String sourceDetails;
    private String projectName;
    private String plotSizeInterested;
    private String budgetRange;
    private String facingPreference;
    private String customerProfile;
    private String paymentMode;
    private boolean prospect;
    private String status;
    private LocalDate nextFollowUpDate;
    private String remarks;
    private String followUp1;
    private String followUp2;
    private String followUp3;
    private String handledBy;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WalkInDto fromEntity(WalkIn e) {
        WalkInDto d = new WalkInDto();
        d.id = e.getId();
        d.visitDate = e.getVisitDate();
        d.visitorName = e.getVisitorName();
        d.phone = e.getPhone();
        d.email = e.getEmail();
        d.source = e.getSource();
        d.sourceDetails = e.getSourceDetails();
        d.projectName = e.getProjectName();
        d.plotSizeInterested = e.getPlotSizeInterested();
        d.budgetRange = e.getBudgetRange();
        d.facingPreference = e.getFacingPreference();
        d.customerProfile = e.getCustomerProfile();
        d.paymentMode = e.getPaymentMode();
        d.prospect = e.isProspect();
        d.status = e.getStatus();
        d.nextFollowUpDate = e.getNextFollowUpDate();
        d.remarks = e.getRemarks();
        d.followUp1 = e.getFollowUp1();
        d.followUp2 = e.getFollowUp2();
        d.followUp3 = e.getFollowUp3();
        d.handledBy = e.getHandledBy();
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getVisitDate() { return visitDate; }
    public void setVisitDate(LocalDate visitDate) { this.visitDate = visitDate; }
    public String getVisitorName() { return visitorName; }
    public void setVisitorName(String visitorName) { this.visitorName = visitorName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getSourceDetails() { return sourceDetails; }
    public void setSourceDetails(String sourceDetails) { this.sourceDetails = sourceDetails; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getPlotSizeInterested() { return plotSizeInterested; }
    public void setPlotSizeInterested(String plotSizeInterested) { this.plotSizeInterested = plotSizeInterested; }
    public String getBudgetRange() { return budgetRange; }
    public void setBudgetRange(String budgetRange) { this.budgetRange = budgetRange; }
    public String getFacingPreference() { return facingPreference; }
    public void setFacingPreference(String facingPreference) { this.facingPreference = facingPreference; }
    public String getCustomerProfile() { return customerProfile; }
    public void setCustomerProfile(String customerProfile) { this.customerProfile = customerProfile; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public boolean isProspect() { return prospect; }
    public void setProspect(boolean prospect) { this.prospect = prospect; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getNextFollowUpDate() { return nextFollowUpDate; }
    public void setNextFollowUpDate(LocalDate nextFollowUpDate) { this.nextFollowUpDate = nextFollowUpDate; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getFollowUp1() { return followUp1; }
    public void setFollowUp1(String followUp1) { this.followUp1 = followUp1; }
    public String getFollowUp2() { return followUp2; }
    public void setFollowUp2(String followUp2) { this.followUp2 = followUp2; }
    public String getFollowUp3() { return followUp3; }
    public void setFollowUp3(String followUp3) { this.followUp3 = followUp3; }
    public String getHandledBy() { return handledBy; }
    public void setHandledBy(String handledBy) { this.handledBy = handledBy; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
