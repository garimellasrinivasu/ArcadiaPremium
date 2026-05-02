package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_documents")
public class ProjectDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String projectName;

    /** Display name chosen by user (or original file name if not overridden) */
    @Column(nullable = false)
    private String fileName;

    /** Original file name from the upload */
    @Column(nullable = false)
    private String originalFileName;

    /** MIME type, e.g. application/pdf, image/png */
    @Column(nullable = false)
    private String contentType;

    /** Size in bytes */
    @Column(nullable = false)
    private long fileSize;

    /** Binary file content stored in DB */
    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] fileData;

    /** Folder this document belongs to (null = project root) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private DocumentFolder folder;

    /** Email of the user who uploaded */
    @Column(nullable = false)
    private String uploadedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public ProjectDocument() {}

    // --- Getters & Setters ---

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

    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }

    public DocumentFolder getFolder() { return folder; }
    public void setFolder(DocumentFolder folder) { this.folder = folder; }

    public Long getFolderId() { return folder != null ? folder.getId() : null; }

    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
