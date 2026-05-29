package com.arcadia.premium.repository;

import com.arcadia.premium.model.MaterialSubGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialSubGroupRepository extends JpaRepository<MaterialSubGroup, Long> {

    List<MaterialSubGroup> findAllByOrderByNameAsc();

    List<MaterialSubGroup> findByMaterialGroupIdOrderByNameAsc(Long materialGroupId);
}
