package com.arcadia.premium.repository;

import com.arcadia.premium.model.FolderPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FolderPermissionRepository extends JpaRepository<FolderPermission, Long> {

    List<FolderPermission> findByFolderId(Long folderId);

    Optional<FolderPermission> findByFolderIdAndUserEmail(Long folderId, String userEmail);

    List<FolderPermission> findByUserEmail(String userEmail);

    void deleteByFolderId(Long folderId);

    boolean existsByFolderIdAndUserEmail(Long folderId, String userEmail);

    /** Find all folder IDs where the user has at least VIEW permission */
    @Query("SELECT fp.folder.id FROM FolderPermission fp WHERE fp.userEmail = :userEmail")
    List<Long> findAccessibleFolderIdsByUserEmail(@Param("userEmail") String userEmail);
}
