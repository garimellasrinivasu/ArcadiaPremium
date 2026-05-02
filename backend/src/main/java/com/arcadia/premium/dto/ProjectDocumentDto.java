package com.arcadia.premium.dto;

import com.arcadia.premium.model.ProjectDocument;

import java.time.LocalDateTime;

public class ProjectDocumentDto {

    private Long id;
    private String projectName;
    private String fileName;
    private String originalFileName;
    private String contentType;
    private long fileSize;
    private String uploadedBy;
    private LocalDateTime createdAt;

    public static ProjectDocumentDto fromEntity(ProjectDocument doc) {
        ProjectDocumentDto dto = new ProjectDocumentDto();
        dto.id = doc.getId();
        dto.projectName = doc.getProjectName();
        dto.fileName = doc.getFileName();
        dto.originalFileName = doc.getOriginalFileName();
        dto.contentType = doc.getContentType();
        dto.fileSize = doc.getFileSize();
        dto.uploadedBy = doc.getUploadedBy();
        dto.createdAt = doc.getCreatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
