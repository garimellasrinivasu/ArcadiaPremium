package com.arcadia.premium.repository;

import com.arcadia.premium.model.ChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, Long> {
    List<ChecklistItem> findByTrackerTypeAndProjectNameOrderBySortOrderAscIdAsc(String trackerType, String projectName);
    long countByTrackerTypeAndProjectName(String trackerType, String projectName);
}
