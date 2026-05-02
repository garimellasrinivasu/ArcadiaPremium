package com.arcadia.premium.service;

import com.arcadia.premium.dto.DocumentFolderDto;
import com.arcadia.premium.model.DocumentFolder;
import com.arcadia.premium.repository.DocumentFolderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DocumentFolderService {

    private static final int MAX_DEPTH = 3;

    private final DocumentFolderRepository repository;

    public DocumentFolderService(DocumentFolderRepository repository) {
        this.repository = repository;
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

    /** Delete a folder and all its contents (children cascade) */
    @Transactional
    public void delete(Long folderId) {
        if (!repository.existsById(folderId)) {
            throw new RuntimeException("Folder not found.");
        }
        repository.deleteById(folderId);
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
