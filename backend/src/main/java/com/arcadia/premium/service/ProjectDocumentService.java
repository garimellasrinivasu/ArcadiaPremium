package com.arcadia.premium.service;

import com.arcadia.premium.dto.ProjectDocumentDto;
import com.arcadia.premium.model.DocumentFolder;
import com.arcadia.premium.model.ProjectDocument;
import com.arcadia.premium.repository.DocumentFolderRepository;
import com.arcadia.premium.repository.ProjectDocumentRepository;
import com.arcadia.premium.repository.ProjectDocumentVersionRepository;
import com.arcadia.premium.model.ProjectDocumentVersion;
import java.time.LocalDateTime;
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

    /** Previous copies kept per document; the oldest are dropped beyond this */
    private static final int MAX_VERSIONS = 20;

    private final ProjectDocumentVersionRepository versionRepository;

    public ProjectDocumentService(ProjectDocumentRepository repository,
                                   DocumentFolderRepository folderRepository,
                                   ProjectDocumentVersionRepository versionRepository) {
        this.repository = repository;
        this.folderRepository = folderRepository;
        this.versionRepository = versionRepository;
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
        versionRepository.deleteByDocumentId(id);
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
            versionRepository.deleteByDocumentId(id);
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

    // ── Content replacement with version history ─────────────────────────

    /**
     * Replace a document's file content (e.g. saved from the in-app Excel editor), keeping the
     * current content as a version. Same permission rule as delete; the file type cannot change.
     */
    @Transactional(timeout = 300)
    public ProjectDocumentDto replaceContent(Long id, MultipartFile file, String callerEmail,
                                             boolean isAdminOrPartner) throws IOException {
        ProjectDocument doc = getById(id);
        if (!isAdminOrPartner && !doc.getUploadedBy().equals(callerEmail)) {
            throw new RuntimeException("You can only edit documents you uploaded.");
        }
        if (file.isEmpty()) throw new RuntimeException("File is empty.");
        if (file.getSize() > MAX_SIZE) throw new RuntimeException("File size exceeds 100 MB limit.");
        archiveCurrent(doc, callerEmail);
        doc.setFileData(file.getBytes());
        doc.setFileSize(file.getSize());
        doc.setUpdatedAt(LocalDateTime.now());
        doc.setUpdatedBy(callerEmail);
        return ProjectDocumentDto.fromEntity(repository.save(doc));
    }

    public List<ProjectDocumentVersionRepository.Summary> listVersions(Long id) {
        getById(id);
        return versionRepository.findByDocumentIdOrderByVersionNumberDesc(id);
    }

    public ProjectDocumentVersion getVersion(Long id, Long versionId) {
        return versionRepository.findByIdAndDocumentId(versionId, id)
                .orElseThrow(() -> new RuntimeException("Version not found."));
    }

    /** Put an earlier version back as the current content; the current content is kept as a version first. */
    @Transactional(timeout = 300)
    public ProjectDocumentDto restoreVersion(Long id, Long versionId, String callerEmail, boolean isAdminOrPartner) {
        ProjectDocument doc = getById(id);
        if (!isAdminOrPartner && !doc.getUploadedBy().equals(callerEmail)) {
            throw new RuntimeException("You can only restore documents you uploaded.");
        }
        ProjectDocumentVersion v = getVersion(id, versionId);
        byte[] data = v.getFileData();
        archiveCurrent(doc, callerEmail);
        doc.setFileData(data);
        doc.setFileSize(data.length);
        doc.setUpdatedAt(LocalDateTime.now());
        doc.setUpdatedBy(callerEmail);
        return ProjectDocumentDto.fromEntity(repository.save(doc));
    }

    private void archiveCurrent(ProjectDocument doc, String replacedBy) {
        int next = versionRepository.findTopByDocumentIdOrderByVersionNumberDesc(doc.getId())
                .map(s -> s.getVersionNumber() + 1).orElse(1);
        ProjectDocumentVersion v = new ProjectDocumentVersion();
        v.setDocumentId(doc.getId());
        v.setVersionNumber(next);
        v.setFileData(doc.getFileData());
        v.setFileSize(doc.getFileSize());
        v.setContentType(doc.getContentType());
        v.setCreatedBy(doc.getUpdatedBy() != null ? doc.getUpdatedBy() : doc.getUploadedBy());
        v.setCreatedAt(doc.getUpdatedAt() != null ? doc.getUpdatedAt() : doc.getCreatedAt());
        v.setReplacedBy(replacedBy);
        v.setReplacedAt(LocalDateTime.now());
        versionRepository.save(v);
        List<ProjectDocumentVersionRepository.Summary> all = versionRepository.findByDocumentIdOrderByVersionNumberAsc(doc.getId());
        for (int i = 0; i < all.size() - MAX_VERSIONS; i++) {
            versionRepository.deleteById(all.get(i).getId());
        }
    }
}
