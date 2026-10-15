package com.arcadia.premium.repository;

import com.arcadia.premium.model.ChecklistMailConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChecklistMailConfigRepository extends JpaRepository<ChecklistMailConfig, Long> {
    Optional<ChecklistMailConfig> findByTrackerTypeAndProjectName(String trackerType, String projectName);
    List<ChecklistMailConfig> findByDailyEnabledTrue();
}
