package com.arcadia.premium.repository;

import com.arcadia.premium.model.VendorMaterialMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorMaterialMappingRepository extends JpaRepository<VendorMaterialMapping, Long> {

    List<VendorMaterialMapping> findByVendorIdOrderByIdAsc(Long vendorId);

    List<VendorMaterialMapping> findByMaterialIdOrderByIdAsc(Long materialId);

    Optional<VendorMaterialMapping> findByVendorIdAndMaterialId(Long vendorId, Long materialId);
}
