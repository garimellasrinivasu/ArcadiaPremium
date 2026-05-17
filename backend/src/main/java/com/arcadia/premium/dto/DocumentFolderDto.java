package com.arcadia.premium.dto;

import com.arcadia.premium.model.DocumentFolder;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class DocumentFolderDto {

    private Long id;
    private String projectName;
    private String name;
    private Long parentId;
    private String createdBy;
    private String createdAt;
    private List<DocumentFolderDto> children;
    private String userPermission;

    public static DocumentFolderDto fromEntity(DocumentFolder folder) {
        DocumentFolderDto dto = new DocumentFolderDto();
        dto.setId(folder.getId());
        dto.setProjectName(folder.getProjectName());
        dto.setName(folder.getName());
        dto.setParentId(folder.getParent() != null ? folder.getParent().getId() : null);
        dto.setCreatedBy(folder.getCreatedBy());
        dto.setCreatedAt(folder.getCreatedAt() != null ? folder.getCreatedAt().toString() : null);
        dto.setChildren(new ArrayList<>());
        return dto;
    }

    /** Build a tree DTO with children populated recursively */
    public static DocumentFolderDto fromEntityTree(DocumentFolder folder) {
        DocumentFolderDto dto = fromEntity(folder);
        if (folder.getChildren() != null && !folder.getChildren().isEmpty()) {
            dto.setChildren(
                folder.getChildren().stream()
                    .map(DocumentFolderDto::fromEntityTree)
                    .collect(Collectors.toList())
            );
        }
        return dto;
    }

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public List<DocumentFolderDto> getChildren() { return children; }
    public void setChildren(List<DocumentFolderDto> children) { this.children = children; }

    public String getUserPermission() { return userPermission; }
    public void setUserPermission(String userPermission) { this.userPermission = userPermission; }
}
