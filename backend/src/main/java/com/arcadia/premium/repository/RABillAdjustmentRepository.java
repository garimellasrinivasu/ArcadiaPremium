package com.arcadia.premium.repository;

import com.arcadia.premium.model.RABillAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RABillAdjustmentRepository extends JpaRepository<RABillAdjustment, Long> {

    List<RABillAdjustment> findByRaBillIdOrderByIdAsc(Long raBillId);

    List<RABillAdjustment> findByRaBillIdAndReleasedFalse(Long raBillId);
}
