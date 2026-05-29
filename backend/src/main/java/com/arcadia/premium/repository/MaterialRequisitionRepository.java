package com.arcadia.premium.repository;

import com.arcadia.premium.model.MaterialRequisition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MaterialRequisitionRepository extends JpaRepository<MaterialRequisition, Long> {

    List<MaterialRequisition> findAllByOrderByCreatedAtDesc();

    List<MaterialRequisition> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<MaterialRequisition> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT MAX(e.requisitionNo) FROM MaterialRequisition e")
    Optional<String> findMaxRequisitionNo();
}
