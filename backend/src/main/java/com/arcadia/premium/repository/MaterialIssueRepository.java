package com.arcadia.premium.repository;

import com.arcadia.premium.model.MaterialIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MaterialIssueRepository extends JpaRepository<MaterialIssue, Long> {

    List<MaterialIssue> findAllByOrderByCreatedAtDesc();

    List<MaterialIssue> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    @Query("SELECT MAX(e.issueNo) FROM MaterialIssue e")
    Optional<String> findMaxIssueNo();
}
