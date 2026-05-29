package com.arcadia.premium.repository;

import com.arcadia.premium.model.MaterialRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRateRepository extends JpaRepository<MaterialRate, Long> {

    List<MaterialRate> findByVendorIdAndMaterialIdOrderByRateDateDesc(Long vendorId, Long materialId);

    List<MaterialRate> findByMaterialIdAndApprovedTrueOrderByRateDateDesc(Long materialId);

    List<MaterialRate> findByVendorIdOrderByRateDateDesc(Long vendorId);

    List<MaterialRate> findAllByOrderByCreatedAtDesc();

    List<MaterialRate> findByMaterialIdOrderByRateDateDesc(Long materialId);
}
