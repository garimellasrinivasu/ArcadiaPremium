package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Who receives the daily / weekly work-plan emails for a project. */
@Entity
@Table(name = "work_plan_mail_configs")
public class WorkPlanMailConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_name", nullable = false, unique = true)
    private String projectName;

    /** Comma-separated email addresses */
    @Column(length = 2000)
    private String recipients;

    @Column(name = "daily_enabled")
    private Boolean dailyEnabled;

    @Column(name = "weekly_enabled")
    private Boolean weeklyEnabled;

    private LocalDateTime lastSentAt;

    @Column(length = 500)
    private String lastSendResult;

    public Long getId() { return id; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getRecipients() { return recipients; }
    public void setRecipients(String recipients) { this.recipients = recipients; }
    public boolean isDailyEnabled() { return Boolean.TRUE.equals(dailyEnabled); }
    public void setDailyEnabled(boolean v) { this.dailyEnabled = v; }
    public boolean isWeeklyEnabled() { return Boolean.TRUE.equals(weeklyEnabled); }
    public void setWeeklyEnabled(boolean v) { this.weeklyEnabled = v; }
    public LocalDateTime getLastSentAt() { return lastSentAt; }
    public void setLastSentAt(LocalDateTime lastSentAt) { this.lastSentAt = lastSentAt; }
    public String getLastSendResult() { return lastSendResult; }
    public void setLastSendResult(String lastSendResult) { this.lastSendResult = lastSendResult; }
}
