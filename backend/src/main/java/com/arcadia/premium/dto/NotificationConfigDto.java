package com.arcadia.premium.dto;

import com.arcadia.premium.model.NotificationConfig;
import java.time.LocalDateTime;

public class NotificationConfigDto {
    private Long id;
    private String projectName;
    private String configType;
    private String recipientName;
    private String recipientValue;
    private boolean active;
    private LocalDateTime createdAt;
    private String createdBy;

    public static NotificationConfigDto fromEntity(NotificationConfig e) {
        NotificationConfigDto d = new NotificationConfigDto();
        d.id = e.getId();
        d.projectName = e.getProjectName();
        d.configType = e.getConfigType();
        d.recipientName = e.getRecipientName();
        d.recipientValue = e.getRecipientValue();
        d.active = e.isActive();
        d.createdAt = e.getCreatedAt();
        d.createdBy = e.getCreatedBy();
        return d;
    }

    // All getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getConfigType() { return configType; }
    public void setConfigType(String configType) { this.configType = configType; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public String getRecipientValue() { return recipientValue; }
    public void setRecipientValue(String recipientValue) { this.recipientValue = recipientValue; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
