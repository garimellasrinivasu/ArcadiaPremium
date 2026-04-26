package com.arcadia.premium.repository;

import com.arcadia.premium.model.SaleEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SaleEntryRepository extends JpaRepository<SaleEntry, Long> {

    List<SaleEntry> findAllByOrderBySerialNoAsc();

    List<SaleEntry> findByProject(String project);

    List<SaleEntry> findByCustomerNameContainingIgnoreCase(String name);

    List<SaleEntry> findByTokenNumberContainingIgnoreCase(String tokenNumber);

    @Query("SELECT s FROM SaleEntry s WHERE LOWER(s.tokenNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.customerName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<SaleEntry> searchByTokenOrCustomerName(@org.springframework.data.repository.query.Param("query") String query);

    @Query("SELECT COALESCE(MAX(s.serialNo), 0) FROM SaleEntry s")
    Integer findMaxSerialNo();
}
