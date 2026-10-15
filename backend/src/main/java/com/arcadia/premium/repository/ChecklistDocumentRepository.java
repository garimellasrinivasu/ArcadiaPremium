package com.arcadia.premium.repository;

import com.arcadia.premium.model.ChecklistDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface ChecklistDocumentRepository extends JpaRepository<ChecklistDocument, Long> {

    /** Document list without file bytes */
    interface Summary {
        Long getId();
        Long getItemId();
        Long getFolderId();
        String getFileName();
        String getContentType();
        long getFileSize();
        String getUploadedBy();
        LocalDateTime getUploadedAt();
    }

    List<Summary> findByItemIdInOrderByUploadedAtDesc(Collection<Long> itemIds);

    List<ChecklistDocument> findByItemId(Long itemId);

    List<ChecklistDocument> findByFolderIdIn(Collection<Long> folderIds);

    void deleteByItemId(Long itemId);
}
