package com.arcadia.premium.repository;

import com.arcadia.premium.model.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    List<WorkOrder> findAllByOrderByCreatedAtDesc();

    List<WorkOrder> findByJobIdOrderByCreatedAtDesc(Long jobId);

    List<WorkOrder> findByContractorIdOrderByCreatedAtDesc(Long contractorId);

    List<WorkOrder> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT MAX(w.woNumber) FROM WorkOrder w")
    Optional<String> findMaxWoNumber();
}
