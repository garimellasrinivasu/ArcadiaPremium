package com.arcadia.premium.repository;

import com.arcadia.premium.model.EstimationTab;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EstimationTabRepository extends JpaRepository<EstimationTab, Long> {
    List<EstimationTab> findByProjectIdOrderBySortOrderAsc(Long projectId);
    void deleteByProjectId(Long projectId);
}
