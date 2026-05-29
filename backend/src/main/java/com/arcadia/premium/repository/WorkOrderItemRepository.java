package com.arcadia.premium.repository;

import com.arcadia.premium.model.WorkOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderItemRepository extends JpaRepository<WorkOrderItem, Long> {

    List<WorkOrderItem> findByWorkOrderIdOrderByIdAsc(Long workOrderId);
}
