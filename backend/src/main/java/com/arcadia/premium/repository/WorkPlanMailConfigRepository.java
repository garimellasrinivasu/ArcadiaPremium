package com.arcadia.premium.repository;

import com.arcadia.premium.model.WorkPlanMailConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkPlanMailConfigRepository extends JpaRepository<WorkPlanMailConfig, Long> {
    Optional<WorkPlanMailConfig> findByProjectName(String projectName);
}
