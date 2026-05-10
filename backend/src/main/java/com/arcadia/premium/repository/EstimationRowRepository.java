package com.arcadia.premium.repository;

import com.arcadia.premium.model.EstimationRow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EstimationRowRepository extends JpaRepository<EstimationRow, Long> {
    List<EstimationRow> findByTabIdOrderBySortOrderAsc(Long tabId);
    void deleteByTabId(Long tabId);
}
