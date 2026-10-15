package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A file attached to a checklist item. The file itself is stored on disk (storagePath, relative to
 * app.checklist.storage-dir) so large scans never have to be held in memory or in the database.
 */
@Entity
@Table(name = "checklist_documents", indexes = @Index(columnList = "item_id"))
public class ChecklistDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    /** Sub-folder inside the item; null = the item's own folder */
    @Column(name = "folder_id")
    private Long folderId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String contentType;

    private long fileSize;

    @Column(nullable = false, length = 1000)
    private String storagePath;

    private String uploadedBy;
    private LocalDateTime uploadedAt;

    public Long getId() { return id; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Long getFolderId() { return folderId; }
    public void setFolderId(Long folderId) { this.folderId = folderId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
