package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "walk_in")
public class WalkIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate visitDate;

    @Column(nullable = false)
    private String visitorName;

    @Column(nullable = false)
    private String phone;

    private String email;

    /** WALK_IN, REFERRAL, WEBSITE, SOCIAL_MEDIA, NEWSPAPER_AD, HOARDING, BROKER, OTHER */
    @Column(nullable = false)
    private String source;

    /** e.g. referral person name, specific ad name */
    private String sourceDetails;

    @Column(nullable = false)
    private String projectName;

    /** e.g. "167 Sq.Yds", "200 Sq.Yds", "250 Sq.Yds", "300 Sq.Yds" */
    private String plotSizeInterested;

    /** e.g. "Under 1 Cr", "1-1.5 Cr", "1.5-2 Cr", "2-3 Cr", "Above 3 Cr" */
    private String budgetRange;

    /** e.g. "East", "West", "North", "South", "Corner", "No Preference" */
    private String facingPreference;

    /** e.g. "Salaried", "Business", "NRI", "Investor" */
    private String customerProfile;

    /** e.g. "Cash", "Loan", "Both" */
    private String paymentMode;

    /** true = hot prospect / interested */
    private boolean prospect = false;

    /** HOT, WARM, COLD, CONVERTED, LOST */
    @Column(nullable = false)
    private String status = "WARM";

    private LocalDate nextFollowUpDate;

    @Column(length = 2000)
    private String remarks;

    @Column(length = 1000)
    private String followUp1;

    @Column(length = 1000)
    private String followUp2;

    @Column(length = 1000)
    private String followUp3;

    /** Sales person name */
    @Column(nullable = false)
    private String handledBy;

    /** Logged-in user email */
    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public WalkIn() {}

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
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
