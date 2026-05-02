package com.arcadia.premium.repository;

import com.arcadia.premium.model.DocumentFolder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentFolderRepository extends JpaRepository<DocumentFolder, Long> {

    /** Get root folders (no parent) for a project */
    List<DocumentFolder> findByProjectNameAndParentIsNullOrderByNameAsc(String projectName);

    /** Get child folders of a given parent */
    List<DocumentFolder> findByParentIdOrderByNameAsc(Long parentId);

    /** Check if a folder name already exists under the same parent for a project */
    boolean existsByProjectNameAndParentIdAndName(String projectName, Long parentId, String name);

    /** Check if a folder name already exists at root level for a project */
    boolean existsByProjectNameAndParentIsNullAndName(String projectName, String name);
}
