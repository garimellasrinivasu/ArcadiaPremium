package com.arcadia.premium.repository;

import com.arcadia.premium.model.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    List<Warehouse> findAllByOrderByNameAsc();

    List<Warehouse> findByProjectIdOrderByNameAsc(Long projectId);

    List<Warehouse> findByActiveTrueOrderByNameAsc();
}
