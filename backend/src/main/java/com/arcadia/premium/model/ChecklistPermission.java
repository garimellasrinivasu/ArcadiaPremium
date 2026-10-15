package com.arcadia.premium.model;

import jakarta.persistence.*;

/** What a (non-admin) user may do on a checklist page. Admins can always do everything. */
@Entity
@Table(name = "checklist_permissions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_email", "tracker_type"}))
public class ChecklistPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "tracker_type", nullable = false, length = 20)
    private String trackerType;

    private boolean canView;
    private boolean canUpload;
    private boolean canDownload;
    private boolean canDelete;
    private boolean canEditStatus;

    public Long getId() { return id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getTrackerType() { return trackerType; }
    public void setTrackerType(String trackerType) { this.trackerType = trackerType; }
    public boolean isCanView() { return canView; }
    public void setCanView(boolean canView) { this.canView = canView; }
    public boolean isCanUpload() { return canUpload; }
    public void setCanUpload(boolean canUpload) { this.canUpload = canUpload; }
    public boolean isCanDownload() { return canDownload; }
    public void setCanDownload(boolean canDownload) { this.canDownload = canDownload; }
    public boolean isCanDelete() { return canDelete; }
    public void setCanDelete(boolean canDelete) { this.canDelete = canDelete; }
    public boolean isCanEditStatus() { return canEditStatus; }
    public void setCanEditStatus(boolean canEditStatus) { this.canEditStatus = canEditStatus; }
}
