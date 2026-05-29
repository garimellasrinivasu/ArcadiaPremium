package com.arcadia.premium.repository;

import com.arcadia.premium.model.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();

    List<PurchaseOrder> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<PurchaseOrder> findByVendorIdOrderByCreatedAtDesc(Long vendorId);

    List<PurchaseOrder> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT MAX(e.poNumber) FROM PurchaseOrder e")
    Optional<String> findMaxPoNumber();
}
