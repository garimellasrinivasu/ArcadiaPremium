package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "folder_permissions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"folder_id", "user_email"}))
public class FolderPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id", nullable = false)
    private DocumentFolder folder;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    /** Comma-separated permission levels, e.g. "VIEW,UPLOAD" or "VIEW,UPLOAD,DELETE,MANAGE" */
    @Column(name = "permission_level", nullable = false)
    private String permissionLevel;

    @Column(name = "granted_by", nullable = false)
    private String grantedBy;

    @CreationTimestamp
    @Column(name = "granted_at")
    private LocalDateTime grantedAt;

    public FolderPermission() {}

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DocumentFolder getFolder() { return folder; }
    public void setFolder(DocumentFolder folder) { this.folder = folder; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getPermissionLevel() { return permissionLevel; }
    public void setPermissionLevel(String permissionLevel) { this.permissionLevel = permissionLevel; }

    /** Check if this permission entry includes the given level */
    public boolean hasLevel(String level) {
        if (permissionLevel == null) return false;
        for (String l : permissionLevel.split(",")) {
            if (l.trim().equalsIgnoreCase(level)) return true;
        }
        return false;
    }

    public String getGrantedBy() { return grantedBy; }
    public void setGrantedBy(String grantedBy) { this.grantedBy = grantedBy; }

    public LocalDateTime getGrantedAt() { return grantedAt; }
    public void setGrantedAt(LocalDateTime grantedAt) { this.grantedAt = grantedAt; }
}
