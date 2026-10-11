package com.arcadia.premium.repository;

import com.arcadia.premium.model.ProjectDocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProjectDocumentVersionRepository extends JpaRepository<ProjectDocumentVersion, Long> {

    /** Version list without the file bytes */
    interface Summary {
        Long getId();
        int getVersionNumber();
        long getFileSize();
        String getCreatedBy();
        LocalDateTime getCreatedAt();
        String getReplacedBy();
        LocalDateTime getReplacedAt();
    }

    List<Summary> findByDocumentIdOrderByVersionNumberDesc(Long documentId);

    Optional<Summary> findTopByDocumentIdOrderByVersionNumberDesc(Long documentId);

    List<Summary> findByDocumentIdOrderByVersionNumberAsc(Long documentId);

    Optional<ProjectDocumentVersion> findByIdAndDocumentId(Long id, Long documentId);

    void deleteByDocumentId(Long documentId);
}
