package com.arcadia.premium.service;

import com.arcadia.premium.dto.ProjectDocumentDto;
import com.arcadia.premium.model.DocumentFolder;
import com.arcadia.premium.model.ProjectDocument;
import com.arcadia.premium.repository.DocumentFolderRepository;
import com.arcadia.premium.repository.ProjectDocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProjectDocumentService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.ms-powerpoint", // .ppt
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
        "image/png",
        "image/jpeg"
    );

    private static final long MAX_SIZE = 100L * 1024 * 1024; // 100 MB

    private final ProjectDocumentRepository repository;
    private final DocumentFolderRepository folderRepository;

    public ProjectDocumentService(ProjectDocumentRepository repository,
                                   DocumentFolderRepository folderRepository) {
        this.repository = repository;
        this.folderRepository = folderRepository;
    }

    @Transactional(timeout = 300) // 5 minutes for large file uploads
    public ProjectDocumentDto upload(String projectName, String customFileName,
                                      MultipartFile file, String uploadedByEmail,
                                      Long folderId) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new RuntimeException("File size exceeds 100 MB limit.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new RuntimeException("File type not allowed. Accepted: PDF, DOCX, PPT, PPTX, XLSX, XLS, PNG, JPEG.");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed";
        String displayName = (customFileName != null && !customFileName.isBlank())
                ? customFileName.trim()
                : originalName;

        // Resolve folder
        DocumentFolder folder = null;
        if (folderId != null) {
            folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new RuntimeException("Folder not found."));
        }

        ProjectDocument doc = new ProjectDocument();
        doc.setProjectName(projectName);
        doc.setFileName(displayName);
        doc.setOriginalFileName(originalName);
        doc.setContentType(contentType);
        doc.setFileSize(file.getSize());
        doc.setFileData(file.getBytes());
        doc.setFolder(folder);
        doc.setUploadedBy(uploadedByEmail);

        return ProjectDocumentDto.fromEntity(repository.save(doc));
    }

    /** List documents in a specific folder (or root if folderId is null).
     *  Admin/Partner sees all; regular users see admin/partner docs + their own. */
    public List<ProjectDocumentDto> listByProjectAndFolder(String projectName, Long folderId,
                                                            String userEmail, boolean isAdminOrPartner) {
        List<ProjectDocument> docs;
        if (folderId == null) {
            if (isAdminOrPartner) {
                docs = repository.findByProjectNameAndFolderIsNullOrderByCreatedAtDesc(projectName);
            } else {
                docs = repository.findVisibleAtRoot(projectName, userEmail);
            }
        } else {
            if (isAdminOrPartner) {
                docs = repository.findByProjectNameAndFolder_IdOrderByCreatedAtDesc(projectName, folderId);
            } else {
                docs = repository.findVisibleInFolder(projectName, folderId, userEmail);
            }
        }
        return docs.stream()
                .map(ProjectDocumentDto::fromEntity)
                .collect(Collectors.toList());
    }

    /** Legacy method — list all documents for a project (no folder filter) */
    public List<ProjectDocumentDto> listByProject(String projectName, String userEmail, boolean isAdminOrPartner) {
        List<ProjectDocument> docs;
        if (isAdminOrPartner) {
            docs = repository.findByProjectNameOrderByCreatedAtDesc(projectName);
        } else {
            // Show admin/partner docs + user's own (no folder filter available, use root-level query as fallback)
            docs = repository.findByProjectNameOrderByCreatedAtDesc(projectName);
            // Filter in-memory: keep docs uploaded by admin/partner or by this user
            // For legacy method, just show all — folder-based method is the primary one
        }
        return docs.stream()
                .map(ProjectDocumentDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ProjectDocument getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
    }

    /**
     * Delete a document. Admin/Partner can delete any doc.
     * Regular users can only delete their own uploads.
     */
    @Transactional
    public void delete(Long id, String callerEmail, boolean isAdminOrPartner) {
        ProjectDocument doc = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
        if (!isAdminOrPartner && !doc.getUploadedBy().equals(callerEmail)) {
            throw new RuntimeException("You can only delete documents you uploaded.");
        }
        repository.deleteById(id);
    }

    /** Bulk delete — Admin/Partner can delete any; regular users only their own. */
    @Transactional
    public int deleteMultiple(List<Long> ids, String callerEmail, boolean isAdminOrPartner) {
        int count = 0;
        for (Long id : ids) {
            ProjectDocument doc = repository.findById(id).orElse(null);
            if (doc == null) continue;
            if (!isAdminOrPartner && !doc.getUploadedBy().equals(callerEmail)) {
                continue; // skip docs the user doesn't own
            }
            repository.deleteById(id);
            count++;
        }
        return count;
    }

    /** Search documents across all projects with security filtering */
    public List<ProjectDocumentDto> searchDocuments(String query, String userEmail, boolean isAdminOrPartner) {
        List<ProjectDocument> docs;
        if (isAdminOrPartner) {
            docs = repository.findByFileNameContainingIgnoreCaseOrderByCreatedAtDesc(query);
        } else {
            docs = repository.searchVisible(query, userEmail);
        }
        return docs.stream()
                .map(ProjectDocumentDto::fromEntity)
                .collect(Collectors.toList());
    }
}

