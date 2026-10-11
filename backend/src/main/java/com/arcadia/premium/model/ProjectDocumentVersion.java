package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A previous copy of a project document, kept whenever the document's content is replaced
 * (e.g. saved from the in-app Excel editor) so it can be downloaded or restored later.
 */
@Entity
@Table(name = "project_document_versions", indexes = @Index(columnList = "document_id"))
public class ProjectDocumentVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    /** 1 = the original upload, then 2, 3, ... */
    @Column(nullable = false)
    private int versionNumber;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] fileData;

    @Column(nullable = false)
    private long fileSize;

    @Column(nullable = false)
    private String contentType;

    /** Who produced this copy (uploader for v1, otherwise the editor who saved it) and when */
    private String createdBy;
    private LocalDateTime createdAt;

    /** Who replaced this copy with a newer one, and when */
    private String replacedBy;
    private LocalDateTime replacedAt;

    public Long getId() { return id; }
    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }
    public int getVersionNumber() { return versionNumber; }
    public void setVersionNumber(int versionNumber) { this.versionNumber = versionNumber; }
    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getReplacedBy() { return replacedBy; }
    public void setReplacedBy(String replacedBy) { this.replacedBy = replacedBy; }
    public LocalDateTime getReplacedAt() { return replacedAt; }
    public void setReplacedAt(LocalDateTime replacedAt) { this.replacedAt = replacedAt; }
}
