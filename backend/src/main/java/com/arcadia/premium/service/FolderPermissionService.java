package com.arcadia.premium.service;

import com.arcadia.premium.dto.FolderPermissionDto;
import com.arcadia.premium.model.DocumentFolder;
import com.arcadia.premium.model.FolderPermission;
import com.arcadia.premium.model.FolderPermissionLevel;
import com.arcadia.premium.model.User;
import com.arcadia.premium.repository.DocumentFolderRepository;
import com.arcadia.premium.repository.FolderPermissionRepository;
import com.arcadia.premium.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FolderPermissionService {

    private final FolderPermissionRepository permissionRepository;
    private final DocumentFolderRepository folderRepository;
    private final UserRepository userRepository;

    public FolderPermissionService(FolderPermissionRepository permissionRepository,
                                   DocumentFolderRepository folderRepository,
                                   UserRepository userRepository) {
        this.permissionRepository = permissionRepository;
        this.folderRepository = folderRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create or update a permission entry for a user on a folder.
     */
    @Transactional
    public FolderPermissionDto setPermission(Long folderId, String userEmail,
                                              FolderPermissionLevel level, String grantedByEmail) {
        DocumentFolder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found with id: " + folderId));

        if (!userRepository.existsByEmail(userEmail)) {
            throw new RuntimeException("User not found with email: " + userEmail);
        }

        Optional<FolderPermission> existing = permissionRepository.findByFolderIdAndUserEmail(folderId, userEmail);

        FolderPermission permission;
        if (existing.isPresent()) {
            permission = existing.get();
            permission.setPermissionLevel(level);
            permission.setGrantedBy(grantedByEmail);
        } else {
            permission = new FolderPermission();
            permission.setFolder(folder);
            permission.setUserEmail(userEmail);
            permission.setPermissionLevel(level);
            permission.setGrantedBy(grantedByEmail);
        }

        permission = permissionRepository.save(permission);

        // Look up user name for the DTO
        User user = userRepository.findByEmail(userEmail).orElse(null);
        String firstName = user != null ? user.getFirstName() : null;
        String lastName = user != null ? user.getLastName() : null;

        return FolderPermissionDto.fromEntity(permission, firstName, lastName);
    }

    /**
     * Remove a permission entry.
     */
    @Transactional
    public void removePermission(Long folderId, String userEmail) {
        FolderPermission permission = permissionRepository.findByFolderIdAndUserEmail(folderId, userEmail)
                .orElseThrow(() -> new RuntimeException("Permission not found for user " + userEmail
                        + " on folder " + folderId));
        permissionRepository.delete(permission);
    }

    /**
     * Get all permissions for a folder, with user names resolved.
     */
    public List<FolderPermissionDto> getPermissionsForFolder(Long folderId) {
        List<FolderPermission> permissions = permissionRepository.findByFolderId(folderId);
        return permissions.stream().map(fp -> {
            User user = userRepository.findByEmail(fp.getUserEmail()).orElse(null);
            String firstName = user != null ? user.getFirstName() : null;
            String lastName = user != null ? user.getLastName() : null;
            return FolderPermissionDto.fromEntity(fp, firstName, lastName);
        }).collect(Collectors.toList());
    }

    /**
     * Check if a user has at least the required permission level on a folder.
     * Uses the hierarchy: MANAGE > DELETE > UPLOAD > VIEW.
     */
    public boolean hasPermission(Long folderId, String userEmail, FolderPermissionLevel requiredLevel) {
        Optional<FolderPermission> permission = permissionRepository.findByFolderIdAndUserEmail(folderId, userEmail);
        return permission.isPresent() && permission.get().getPermissionLevel().isAtLeast(requiredLevel);
    }

    /**
     * Get all folder IDs the user can access (at least VIEW).
     */
    public Set<Long> getAccessibleFolderIds(String userEmail) {
        return new HashSet<>(permissionRepository.findAccessibleFolderIdsByUserEmail(userEmail));
    }

    /**
     * Check if a user can access a folder.
     * Admin always has access. Creator always has access. Otherwise check permissions.
     */
    public boolean canUserAccessFolder(Long folderId, String userEmail, String createdBy, boolean isAdmin) {
        if (isAdmin) return true;
        if (userEmail.equals(createdBy)) return true;
        return hasPermission(folderId, userEmail, FolderPermissionLevel.VIEW);
    }
}
