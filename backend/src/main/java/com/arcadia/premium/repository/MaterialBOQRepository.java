package com.arcadia.premium.repository;

import com.arcadia.premium.model.MaterialBOQ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialBOQRepository extends JpaRepository<MaterialBOQ, Long> {

    List<MaterialBOQ> findByProjectIdOrderByIdAsc(Long projectId);

    List<MaterialBOQ> findByProjectIdAndUnitNameOrderByIdAsc(Long projectId, String unitName);

    List<MaterialBOQ> findByMaterialIdOrderByIdAsc(Long materialId);
}
