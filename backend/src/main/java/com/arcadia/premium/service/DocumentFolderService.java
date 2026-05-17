package com.arcadia.premium.service;

import com.arcadia.premium.dto.DocumentFolderDto;
import com.arcadia.premium.model.DocumentFolder;
import com.arcadia.premium.repository.DocumentFolderRepository;
import com.arcadia.premium.repository.FolderPermissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.arcadia.premium.model.FolderPermission;
import com.arcadia.premium.model.FolderPermissionLevel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DocumentFolderService {

    private static final int MAX_DEPTH = 3;

    private final DocumentFolderRepository repository;
    private final FolderPermissionRepository folderPermissionRepository;
    private final FolderPermissionService folderPermissionService;

    public DocumentFolderService(DocumentFolderRepository repository,
                                  FolderPermissionRepository folderPermissionRepository,
                                  FolderPermissionService folderPermissionService) {
        this.repository = repository;
        this.folderPermissionRepository = folderPermissionRepository;
        this.folderPermissionService = folderPermissionService;
    }

    /** Create a folder. parentId = null means root level under the project. */
    @Transactional
    public DocumentFolderDto create(String projectName, String name, Long parentId, String createdBy) {
        if (name == null || name.isBlank()) {
            throw new RuntimeException("Folder name is required.");
        }
        String trimmedName = name.trim();

        // Check duplicate name at the same level
        if (parentId == null) {
            if (repository.existsByProjectNameAndParentIsNullAndName(projectName, trimmedName)) {
                throw new RuntimeException("A folder named \"" + trimmedName + "\" already exists at this level.");
            }
        } else {
            if (repository.existsByProjectNameAndParentIdAndName(projectName, parentId, trimmedName)) {
                throw new RuntimeException("A folder named \"" + trimmedName + "\" already exists at this level.");
            }
        }

        // Check depth limit
        DocumentFolder parent = null;
        if (parentId != null) {
            parent = repository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent folder not found."));
            int depth = getDepth(parent);
            if (depth + 1 >= MAX_DEPTH) {
                throw new RuntimeException("Maximum folder depth of " + MAX_DEPTH + " levels reached.");
            }
        }

        DocumentFolder folder = new DocumentFolder();
        folder.setProjectName(projectName);
        folder.setName(trimmedName);
        folder.setParent(parent);
        folder.setCreatedBy(createdBy);

        return DocumentFolderDto.fromEntity(repository.save(folder));
    }

    /** Get the full folder tree for a project (root folders with nested children) */
    public List<DocumentFolderDto> getTree(String projectName) {
        List<DocumentFolder> roots = repository.findByProjectNameAndParentIsNullOrderByNameAsc(projectName);
        return roots.stream()
                .map(DocumentFolderDto::fromEntityTree)
                .collect(Collectors.toList());
    }

    /** Get the folder tree filtered by user permissions */
    public List<DocumentFolderDto> getTree(String projectName, String userEmail, boolean isAdmin) {
        List<DocumentFolder> roots = repository.findByProjectNameAndParentIsNullOrderByNameAsc(projectName);

        // Build a permission-level map for the current user: folderId → permission level
        Map<Long, String> userPermMap = new HashMap<>();
        if (!isAdmin) {
            List<FolderPermission> userPerms = folderPermissionRepository.findByUserEmail(userEmail);
            for (FolderPermission fp : userPerms) {
                userPermMap.put(fp.getFolder().getId(), fp.getPermissionLevel().name());
            }
        }

        if (isAdmin) {
            // Admin sees everything; set userPermission = "MANAGE" on all folders
            return roots.stream()
                    .map(root -> toTreeWithPermission(root, userEmail, isAdmin, userPermMap))
                    .collect(Collectors.toList());
        }

        // Non-admin: filter by access
        Set<Long> accessibleIds = new java.util.HashSet<>(userPermMap.keySet());
        return roots.stream()
                .map(root -> filterTreeByAccess(root, userEmail, accessibleIds, userPermMap, isAdmin))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /** Build tree DTO with userPermission populated (for admin — no filtering) */
    private DocumentFolderDto toTreeWithPermission(DocumentFolder folder, String userEmail,
                                                     boolean isAdmin, Map<Long, String> userPermMap) {
        DocumentFolderDto dto = DocumentFolderDto.fromEntity(folder);
        // Admin gets MANAGE, creator gets MANAGE, others get their actual level
        if (isAdmin || folder.getCreatedBy().equals(userEmail)) {
            dto.setUserPermission("MANAGE");
        } else {
            dto.setUserPermission(userPermMap.get(folder.getId()));
        }
        if (folder.getChildren() != null && !folder.getChildren().isEmpty()) {
            dto.setChildren(
                folder.getChildren().stream()
                    .map(child -> toTreeWithPermission(child, userEmail, isAdmin, userPermMap))
                    .collect(Collectors.toList())
            );
        }
        return dto;
    }

    /** Filter tree by access and populate userPermission */
    private DocumentFolderDto filterTreeByAccess(DocumentFolder folder, String userEmail,
                                                   Set<Long> accessibleIds, Map<Long, String> userPermMap,
                                                   boolean isAdmin) {
        boolean isCreator = folder.getCreatedBy().equals(userEmail);
        boolean hasExplicitAccess = accessibleIds.contains(folder.getId());
        boolean hasAccess = isCreator || hasExplicitAccess;

        List<DocumentFolderDto> filteredChildren = new ArrayList<>();
        if (folder.getChildren() != null) {
            for (DocumentFolder child : folder.getChildren()) {
                DocumentFolderDto filteredChild = filterTreeByAccess(child, userEmail, accessibleIds, userPermMap, isAdmin);
                if (filteredChild != null) filteredChildren.add(filteredChild);
            }
        }
        // Show folder if user has direct access OR if it has accessible children
        if (hasAccess || !filteredChildren.isEmpty()) {
            DocumentFolderDto dto = DocumentFolderDto.fromEntity(folder);
            dto.setChildren(filteredChildren);
            // Set the user's permission level
            if (isCreator) {
                dto.setUserPermission("MANAGE"); // creator always has full control
            } else {
                dto.setUserPermission(userPermMap.get(folder.getId())); // explicit permission or null
            }
            return dto;
        }
        return null;
    }

    /** Rename a folder */
    @Transactional
    public DocumentFolderDto rename(Long folderId, String newName) {
        if (newName == null || newName.isBlank()) {
            throw new RuntimeException("Folder name is required.");
        }
        DocumentFolder folder = repository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found."));

        String trimmedName = newName.trim();
        Long parentId = folder.getParent() != null ? folder.getParent().getId() : null;

        // Check duplicate at same level (excluding itself)
        if (parentId == null) {
            if (repository.existsByProjectNameAndParentIsNullAndName(folder.getProjectName(), trimmedName)) {
                // Might be itself — check
                List<DocumentFolder> roots = repository.findByProjectNameAndParentIsNullOrderByNameAsc(folder.getProjectName());
                boolean conflict = roots.stream().anyMatch(f -> f.getName().equals(trimmedName) && !f.getId().equals(folderId));
                if (conflict) {
                    throw new RuntimeException("A folder named \"" + trimmedName + "\" already exists at this level.");
                }
            }
        } else {
            if (repository.existsByProjectNameAndParentIdAndName(folder.getProjectName(), parentId, trimmedName)) {
                List<DocumentFolder> siblings = repository.findByParentIdOrderByNameAsc(parentId);
                boolean conflict = siblings.stream().anyMatch(f -> f.getName().equals(trimmedName) && !f.getId().equals(folderId));
                if (conflict) {
                    throw new RuntimeException("A folder named \"" + trimmedName + "\" already exists at this level.");
                }
            }
        }

        folder.setName(trimmedName);
        return DocumentFolderDto.fromEntity(repository.save(folder));
    }

    /** Delete a folder and all its contents (children cascade). Also removes permissions. */
    @Transactional
    public void delete(Long folderId) {
        if (!repository.existsById(folderId)) {
            throw new RuntimeException("Folder not found.");
        }
        // Delete permissions for this folder (and recursively for children)
        deletePermissionsRecursively(folderId);
        repository.deleteById(folderId);
    }

    /** Recursively delete permissions for a folder and all its children */
    private void deletePermissionsRecursively(Long folderId) {
        List<DocumentFolder> children = repository.findByParentIdOrderByNameAsc(folderId);
        for (DocumentFolder child : children) {
            deletePermissionsRecursively(child.getId());
        }
        folderPermissionRepository.deleteByFolderId(folderId);
    }

    /** Get the depth of a folder (root = 0) */
    private int getDepth(DocumentFolder folder) {
        int depth = 0;
        DocumentFolder current = folder;
        while (current.getParent() != null) {
            depth++;
            current = current.getParent();
        }
        return depth;
    }

    /** Get a folder by ID */
    public DocumentFolder getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder not found with id: " + id));
    }

    /** Build the breadcrumb path for a folder */
    public List<DocumentFolderDto> getBreadcrumb(Long folderId) {
        List<DocumentFolderDto> path = new java.util.ArrayList<>();
        DocumentFolder current = repository.findById(folderId).orElse(null);
        while (current != null) {
            path.add(0, DocumentFolderDto.fromEntity(current));
            current = current.getParent();
        }
        return path;
    }
}
