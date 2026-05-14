package com.arcadia.premium.repository;

import com.arcadia.premium.model.ProjectDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    /* ── Queries for mixed visibility: user sees own docs + admin/partner docs ── */

    /** Root level: user's own docs + docs uploaded by ADMIN/PARTNER users */
    @Query("SELECT d FROM ProjectDocument d WHERE d.projectName = :project AND d.folder IS NULL " +
           "AND (d.uploadedBy = :email OR d.uploadedBy IN " +
           "  (SELECT u.email FROM User u WHERE u.role.name IN ('ADMIN','PARTNER'))) " +
           "ORDER BY d.createdAt DESC")
    List<ProjectDocument> findVisibleAtRoot(@Param("project") String projectName,
                                            @Param("email") String userEmail);

    /** Inside folder: user's own docs + docs uploaded by ADMIN/PARTNER users */
    @Query("SELECT d FROM ProjectDocument d WHERE d.projectName = :project AND d.folder.id = :folderId " +
           "AND (d.uploadedBy = :email OR d.uploadedBy IN " +
           "  (SELECT u.email FROM User u WHERE u.role.name IN ('ADMIN','PARTNER'))) " +
           "ORDER BY d.createdAt DESC")
    List<ProjectDocument> findVisibleInFolder(@Param("project") String projectName,
                                              @Param("folderId") Long folderId,
                                              @Param("email") String userEmail);

    /** Search: user's own docs + docs uploaded by ADMIN/PARTNER users */
    @Query("SELECT d FROM ProjectDocument d WHERE LOWER(d.fileName) LIKE LOWER(CONCAT('%',:query,'%')) " +
           "AND (d.uploadedBy = :email OR d.uploadedBy IN " +
           "  (SELECT u.email FROM User u WHERE u.role.name IN ('ADMIN','PARTNER'))) " +
           "ORDER BY d.createdAt DESC")
    List<ProjectDocument> searchVisible(@Param("query") String query,
                                        @Param("email") String userEmail);
}

