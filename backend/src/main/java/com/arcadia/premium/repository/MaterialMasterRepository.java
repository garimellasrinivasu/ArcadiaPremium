package com.arcadia.premium.repository;

import com.arcadia.premium.model.MaterialMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialMasterRepository extends JpaRepository<MaterialMaster, Long> {

    List<MaterialMaster> findAllByOrderByNameAsc();

    List<MaterialMaster> findByMaterialGroupIdOrderByNameAsc(Long materialGroupId);

    List<MaterialMaster> findByMaterialSubGroupIdOrderByNameAsc(Long materialSubGroupId);

    List<MaterialMaster> findByActiveTrueOrderByNameAsc();
}
