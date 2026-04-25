package com.arcadia.premium.repository;

import com.arcadia.premium.model.SaleEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SaleEntryRepository extends JpaRepository<SaleEntry, Long> {

    List<SaleEntry> findAllByOrderBySerialNoAsc();

    List<SaleEntry> findByProject(String project);

    List<SaleEntry> findByCustomerNameContainingIgnoreCase(String name);

    @Query("SELECT COALESCE(MAX(s.serialNo), 0) FROM SaleEntry s")
    Integer findMaxSerialNo();
}
