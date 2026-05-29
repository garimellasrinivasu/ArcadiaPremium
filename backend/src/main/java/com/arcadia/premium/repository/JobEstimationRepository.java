package com.arcadia.premium.repository;

import com.arcadia.premium.model.JobEstimation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobEstimationRepository extends JpaRepository<JobEstimation, Long> {

    List<JobEstimation> findByJobIdOrderByIdAsc(Long jobId);

    Optional<JobEstimation> findByJobIdAndActivityId(Long jobId, Long activityId);
}
