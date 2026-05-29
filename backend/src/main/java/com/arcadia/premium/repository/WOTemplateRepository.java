package com.arcadia.premium.repository;

import com.arcadia.premium.model.WOTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WOTemplateRepository extends JpaRepository<WOTemplate, Long> {

    List<WOTemplate> findAllByOrderByNameAsc();

    List<WOTemplate> findByActiveTrueOrderByNameAsc();

    @Query("SELECT MAX(w.code) FROM WOTemplate w")
    Optional<String> findMaxCode();
}
