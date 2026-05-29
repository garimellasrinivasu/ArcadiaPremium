package com.arcadia.premium.repository;

import com.arcadia.premium.model.RABill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RABillRepository extends JpaRepository<RABill, Long> {

    List<RABill> findAllByOrderByCreatedAtDesc();

    List<RABill> findByWorkOrderIdOrderByCreatedAtDesc(Long workOrderId);

    List<RABill> findByContractorIdOrderByCreatedAtDesc(Long contractorId);

    List<RABill> findByBillTypeOrderByCreatedAtDesc(String billType);

    @Query("SELECT MAX(e.billNo) FROM RABill e")
    Optional<String> findMaxBillNo();
}
