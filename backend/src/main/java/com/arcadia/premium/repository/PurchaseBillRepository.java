package com.arcadia.premium.repository;

import com.arcadia.premium.model.PurchaseBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PurchaseBillRepository extends JpaRepository<PurchaseBill, Long> {

    List<PurchaseBill> findAllByOrderByCreatedAtDesc();

    List<PurchaseBill> findByPurchaseOrderIdOrderByCreatedAtDesc(Long purchaseOrderId);

    List<PurchaseBill> findByVendorIdOrderByCreatedAtDesc(Long vendorId);

    @Query("SELECT MAX(e.billNo) FROM PurchaseBill e")
    Optional<String> findMaxBillNo();
}
