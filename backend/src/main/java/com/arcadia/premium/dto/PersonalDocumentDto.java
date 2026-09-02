package com.arcadia.premium.dto;

import com.arcadia.premium.model.PersonalDocument;

import java.time.LocalDateTime;

public class PersonalDocumentDto {

    private Long id;
    private String category;
    private String fileName;
    private String originalFileName;
    private String contentType;
    private long fileSize;
    private String uploadedBy;
    private String description;
    private LocalDateTime createdAt;

    public PersonalDocumentDto() {}

    public static PersonalDocumentDto fromEntity(PersonalDocument e) {
        PersonalDocumentDto dto = new PersonalDocumentDto();
        dto.setId(e.getId());
        dto.setCategory(e.getCategory());
        dto.setFileName(e.getFileName());
        dto.setOriginalFileName(e.getOriginalFileName());
        dto.setContentType(e.getContentType());
        dto.setFileSize(e.getFileSize());
        dto.setUploadedBy(e.getUploadedBy());
        dto.setDescription(e.getDescription());
        dto.setCreatedAt(e.getCreatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

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

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
