package com.arcadia.premium.repository;

import com.arcadia.premium.model.VillaConstructionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VillaConstructionStatusRepository extends JpaRepository<VillaConstructionStatus, Long> {

    List<VillaConstructionStatus> findByProjectName(String projectName);

    List<VillaConstructionStatus> findByProjectNameAndPhase(String projectName, String phase);

    Optional<VillaConstructionStatus> findByProjectNameAndVillaNumberAndPhase(
            String projectName, Integer villaNumber, String phase);

    /** One-time backfill: stages ticked by a schedule import before the import flag existed */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("update VillaConstructionStatus v set v.completionImported = true " +
            "where v.activity1Done = true and v.completedAt is null and v.actualCompletionDate is null " +
            "and v.completionImported is null and v.updatedAt >= :since")
    int markImportedCompletions(@org.springframework.data.repository.query.Param("since") LocalDateTime since);

    List<VillaConstructionStatus> findByProjectNameAndActivity1DoneAndUpdatedAtAfter(
            String projectName, boolean activity1Done, LocalDateTime after);
}
