package com.arcadia.premium.repository;

import com.arcadia.premium.model.VillaConstructionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VillaConstructionStatusRepository extends JpaRepository<VillaConstructionStatus, Long> {

    List<VillaConstructionStatus> findByProjectName(String projectName);

    List<VillaConstructionStatus> findByProjectNameAndPhase(String projectName, String phase);

    Optional<VillaConstructionStatus> findByProjectNameAndVillaNumberAndPhase(
            String projectName, Integer villaNumber, String phase);
}
