package com.arcadia.premium.controller;

import com.arcadia.premium.dto.FolderPermissionDto;
import com.arcadia.premium.model.DocumentFolder;
import com.arcadia.premium.model.FolderPermissionLevel;
import com.arcadia.premium.service.DocumentFolderService;
import com.arcadia.premium.service.FolderPermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/folder-permissions")
public class FolderPermissionController {

    private final FolderPermissionService permissionService;
    private final DocumentFolderService folderService;

    public FolderPermissionController(FolderPermissionService permissionService,
                                      DocumentFolderService folderService) {
        this.permissionService = permissionService;
        this.folderService = folderService;
    }

    /** Get all permissions for a folder */
    @GetMapping("/{folderId}")
    public ResponseEntity<?> getPermissions(@PathVariable Long folderId, Principal principal) {
        try {
            DocumentFolder folder = folderService.getById(folderId);
            String userEmail = principal.getName();
            boolean isAdmin = isCurrentUserAdmin();

            if (!isAdmin && !folder.getCreatedBy().equals(userEmail)
                    && !permissionService.hasPermission(folderId, userEmail, FolderPermissionLevel.MANAGE)) {
                return ResponseEntity.status(403).body(Map.of("error", "You do not have permission to view permissions for this folder."));
            }

            List<FolderPermissionDto> permissions = permissionService.getPermissionsForFolder(folderId);
            return ResponseEntity.ok(permissions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Set (create or update) a permission */
    @PostMapping
    public ResponseEntity<?> setPermission(@RequestBody Map<String, Object> request, Principal principal) {
        try {
            Long folderId = Long.valueOf(request.get("folderId").toString());
            String userEmail = (String) request.get("userEmail");
            String levelStr = (String) request.get("permissionLevel");
            FolderPermissionLevel level = FolderPermissionLevel.valueOf(levelStr);

            DocumentFolder folder = folderService.getById(folderId);
            String currentUser = principal.getName();
            boolean isAdmin = isCurrentUserAdmin();

            if (!isAdmin && !folder.getCreatedBy().equals(currentUser)
                    && !permissionService.hasPermission(folderId, currentUser, FolderPermissionLevel.MANAGE)) {
                return ResponseEntity.status(403).body(Map.of("error", "You do not have permission to manage permissions for this folder."));
            }

            FolderPermissionDto dto = permissionService.setPermission(folderId, userEmail, level, currentUser);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Remove a permission */
    @DeleteMapping("/{folderId}/{userEmail}")
    public ResponseEntity<?> removePermission(@PathVariable Long folderId,
                                               @PathVariable String userEmail,
                                               Principal principal) {
        try {
            DocumentFolder folder = folderService.getById(folderId);
            String currentUser = principal.getName();
            boolean isAdmin = isCurrentUserAdmin();

            if (!isAdmin && !folder.getCreatedBy().equals(currentUser)
                    && !permissionService.hasPermission(folderId, currentUser, FolderPermissionLevel.MANAGE)) {
                return ResponseEntity.status(403).body(Map.of("error", "You do not have permission to manage permissions for this folder."));
            }

            permissionService.removePermission(folderId, userEmail);
            return ResponseEntity.ok(Map.of("message", "Permission removed successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private boolean isCurrentUserAdmin() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
