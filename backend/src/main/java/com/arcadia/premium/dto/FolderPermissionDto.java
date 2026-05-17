package com.arcadia.premium.dto;

import com.arcadia.premium.model.FolderPermission;

public class FolderPermissionDto {

    private Long id;
    private Long folderId;
    private String folderName;
    private String userEmail;
    private String userName;
    private String permissionLevel;
    private String grantedBy;
    private String grantedAt;

    /**
     * Build a DTO from the entity. Pass firstName/lastName to populate userName,
     * or null if not available.
     */
    public static FolderPermissionDto fromEntity(FolderPermission entity,
                                                  String firstName, String lastName) {
        FolderPermissionDto dto = new FolderPermissionDto();
        dto.setId(entity.getId());
        dto.setFolderId(entity.getFolder().getId());
        dto.setFolderName(entity.getFolder().getName());
        dto.setUserEmail(entity.getUserEmail());
        if (firstName != null && lastName != null) {
            dto.setUserName(firstName + " " + lastName);
        } else {
            dto.setUserName(entity.getUserEmail());
        }
        dto.setPermissionLevel(entity.getPermissionLevel().name());
        dto.setGrantedBy(entity.getGrantedBy());
        dto.setGrantedAt(entity.getGrantedAt() != null ? entity.getGrantedAt().toString() : null);
        return dto;
    }

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFolderId() { return folderId; }
    public void setFolderId(Long folderId) { this.folderId = folderId; }

    public String getFolderName() { return folderName; }
    public void setFolderName(String folderName) { this.folderName = folderName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getPermissionLevel() { return permissionLevel; }
    public void setPermissionLevel(String permissionLevel) { this.permissionLevel = permissionLevel; }

    public String getGrantedBy() { return grantedBy; }
    public void setGrantedBy(String grantedBy) { this.grantedBy = grantedBy; }

    public String getGrantedAt() { return grantedAt; }
    public void setGrantedAt(String grantedAt) { this.grantedAt = grantedAt; }
}
