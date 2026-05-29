package com.arcadia.premium.repository;

import com.arcadia.premium.model.RateAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RateAnalysisRepository extends JpaRepository<RateAnalysis, Long> {

    List<RateAnalysis> findAllByOrderByCreatedAtDesc();

    List<RateAnalysis> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<RateAnalysis> findByActivityIdOrderByCreatedAtDesc(Long activityId);

    Optional<RateAnalysis> findByProjectIdAndActivityId(Long projectId, Long activityId);
}
