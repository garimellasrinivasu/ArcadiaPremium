package com.arcadia.premium.service;

import com.arcadia.premium.dto.ProjectDocumentDto;
import com.arcadia.premium.model.ProjectDocument;
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
        "image/png",
        "image/jpeg"
    );

    private static final long MAX_SIZE = 100L * 1024 * 1024; // 100 MB

    private final ProjectDocumentRepository repository;

    public ProjectDocumentService(ProjectDocumentRepository repository) {
        this.repository = repository;
    }

    @Transactional(timeout = 300) // 5 minutes for large file uploads
    public ProjectDocumentDto upload(String projectName, String customFileName,
                                      MultipartFile file, String uploadedByEmail) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new RuntimeException("File size exceeds 100 MB limit.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new RuntimeException("File type not allowed. Accepted: PDF, DOCX, PPT, PPTX, PNG, JPEG.");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed";
        String displayName = (customFileName != null && !customFileName.isBlank())
                ? customFileName.trim()
                : originalName;

        ProjectDocument doc = new ProjectDocument();
        doc.setProjectName(projectName);
        doc.setFileName(displayName);
        doc.setOriginalFileName(originalName);
        doc.setContentType(contentType);
        doc.setFileSize(file.getSize());
        doc.setFileData(file.getBytes());
        doc.setUploadedBy(uploadedByEmail);

        return ProjectDocumentDto.fromEntity(repository.save(doc));
    }

    /** Admin sees all documents; regular users see only their own uploads */
    public List<ProjectDocumentDto> listByProject(String projectName, String userEmail, boolean isAdmin) {
        List<ProjectDocument> docs;
        if (isAdmin) {
            docs = repository.findByProjectNameOrderByCreatedAtDesc(projectName);
        } else {
            docs = repository.findByProjectNameAndUploadedByOrderByCreatedAtDesc(projectName, userEmail);
        }
        return docs.stream()
                .map(ProjectDocumentDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ProjectDocument getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Document not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
