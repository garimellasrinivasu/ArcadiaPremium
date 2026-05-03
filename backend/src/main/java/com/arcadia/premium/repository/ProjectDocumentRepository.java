package com.arcadia.premium.repository;

import com.arcadia.premium.model.ProjectDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, Long> {

    List<ProjectDocument> findByProjectNameOrderByCreatedAtDesc(String projectName);

    List<ProjectDocument> findByProjectNameAndUploadedByOrderByCreatedAtDesc(String projectName, String uploadedBy);

    /** Documents in a specific folder */
    List<ProjectDocument> findByProjectNameAndFolder_IdOrderByCreatedAtDesc(String projectName, Long folderId);

    List<ProjectDocument> findByProjectNameAndFolder_IdAndUploadedByOrderByCreatedAtDesc(
            String projectName, Long folderId, String uploadedBy);

    /** Documents at root level (no folder) */
    List<ProjectDocument> findByProjectNameAndFolderIsNullOrderByCreatedAtDesc(String projectName);

    List<ProjectDocument> findByProjectNameAndFolderIsNullAndUploadedByOrderByCreatedAtDesc(
            String projectName, String uploadedBy);

    /** Count documents in a folder */
    long countByFolder_Id(Long folderId);

    long countByProjectName(String projectName);
    
    /** Search documents across all projects */
    List<ProjectDocument> findByFileNameContainingIgnoreCaseOrderByCreatedAtDesc(String query);

    List<ProjectDocument> findByFileNameContainingIgnoreCaseAndUploadedByOrderByCreatedAtDesc(String query, String uploadedBy);
}

