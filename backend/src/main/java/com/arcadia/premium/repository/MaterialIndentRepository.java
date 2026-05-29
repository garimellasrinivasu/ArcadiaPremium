package com.arcadia.premium.repository;

import com.arcadia.premium.model.MaterialIndent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MaterialIndentRepository extends JpaRepository<MaterialIndent, Long> {

    List<MaterialIndent> findAllByOrderByCreatedAtDesc();

    List<MaterialIndent> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    @Query("SELECT MAX(e.indentNo) FROM MaterialIndent e")
    Optional<String> findMaxIndentNo();
}
