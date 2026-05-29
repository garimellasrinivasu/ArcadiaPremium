package com.arcadia.premium.repository;

import com.arcadia.premium.model.CostingStandardHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CostingStandardHeadRepository extends JpaRepository<CostingStandardHead, Long> {

    List<CostingStandardHead> findAllByOrderByNameAsc();

    List<CostingStandardHead> findByActiveTrueOrderByNameAsc();

    List<CostingStandardHead> findByCategoryOrderByNameAsc(String category);

    @Query("SELECT MAX(c.code) FROM CostingStandardHead c")
    Optional<String> findMaxCode();
}
