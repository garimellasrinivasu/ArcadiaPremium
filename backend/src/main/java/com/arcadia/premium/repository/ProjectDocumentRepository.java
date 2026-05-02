package com.arcadia.premium.repository;

import com.arcadia.premium.model.ProjectDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, Long> {

    List<ProjectDocument> findByProjectNameOrderByCreatedAtDesc(String projectName);

    List<ProjectDocument> findByProjectNameAndUploadedByOrderByCreatedAtDesc(String projectName, String uploadedBy);

    long countByProjectName(String projectName);
}
