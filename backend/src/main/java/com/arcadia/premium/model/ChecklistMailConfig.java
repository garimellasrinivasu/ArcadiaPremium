package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Who receives the summary email for a checklist page and project, and whether the nightly email is on. */
@Entity
@Table(name = "checklist_mail_configs",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tracker_type", "project_name"}))
public class ChecklistMailConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tracker_type", nullable = false, length = 20)
    private String trackerType;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    /** Comma-separated email addresses */
    @Column(length = 2000)
    private String recipients;

    /** Send automatically every night at 11 PM IST */
    private boolean dailyEnabled = true;

    private LocalDateTime lastSentAt;
    private String lastSendResult;

    public Long getId() { return id; }
    public String getTrackerType() { return trackerType; }
    public void setTrackerType(String trackerType) { this.trackerType = trackerType; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getRecipients() { return recipients; }
    public void setRecipients(String recipients) { this.recipients = recipients; }
    public boolean isDailyEnabled() { return dailyEnabled; }
    public void setDailyEnabled(boolean dailyEnabled) { this.dailyEnabled = dailyEnabled; }
    public LocalDateTime getLastSentAt() { return lastSentAt; }
    public void setLastSentAt(LocalDateTime lastSentAt) { this.lastSentAt = lastSentAt; }
    public String getLastSendResult() { return lastSendResult; }
    public void setLastSendResult(String lastSendResult) { this.lastSendResult = lastSendResult; }
}
