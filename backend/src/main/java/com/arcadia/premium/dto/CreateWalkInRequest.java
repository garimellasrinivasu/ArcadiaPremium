package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreateWalkInRequest {

    @NotNull
    private LocalDate visitDate;

    @NotBlank
    private String visitorName;

    @NotBlank
    private String phone;

    private String email;

    @NotBlank
    private String source;

    private String sourceDetails;

    @NotBlank
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

    @NotBlank
    private String handledBy;

    // Getters and Setters
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
}
