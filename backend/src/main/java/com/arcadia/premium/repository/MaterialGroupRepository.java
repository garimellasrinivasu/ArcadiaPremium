package com.arcadia.premium.repository;

import com.arcadia.premium.model.MaterialGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialGroupRepository extends JpaRepository<MaterialGroup, Long> {

    List<MaterialGroup> findAllByOrderByNameAsc();

    List<MaterialGroup> findByActiveTrueOrderByNameAsc();
}
