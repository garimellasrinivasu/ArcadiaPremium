package com.arcadia.premium.repository;

import com.arcadia.premium.model.CostingCustomHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CostingCustomHeadRepository extends JpaRepository<CostingCustomHead, Long> {

    List<CostingCustomHead> findAllByOrderByNameAsc();

    List<CostingCustomHead> findByProjectIdOrderByNameAsc(Long projectId);

    List<CostingCustomHead> findByActiveTrueOrderByNameAsc();

    @Query("SELECT MAX(c.code) FROM CostingCustomHead c")
    Optional<String> findMaxCode();
}
