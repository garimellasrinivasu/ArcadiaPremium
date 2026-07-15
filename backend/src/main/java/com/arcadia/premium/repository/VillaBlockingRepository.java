package com.arcadia.premium.repository;

import com.arcadia.premium.model.VillaBlocking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VillaBlockingRepository extends JpaRepository<VillaBlocking, Long> {

    Optional<VillaBlocking> findByVillaNumber(Integer villaNumber);

    List<VillaBlocking> findAll();

    boolean existsByVillaNumber(Integer villaNumber);
}
