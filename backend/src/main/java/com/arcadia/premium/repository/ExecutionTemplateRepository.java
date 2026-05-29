package com.arcadia.premium.repository;

import com.arcadia.premium.model.ExecutionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExecutionTemplateRepository extends JpaRepository<ExecutionTemplate, Long> {

    List<ExecutionTemplate> findByProjectIdOrderByNameAsc(Long projectId);

    List<ExecutionTemplate> findAllByOrderByCreatedAtDesc();
}
