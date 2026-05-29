package com.arcadia.premium.repository;

import com.arcadia.premium.model.MapCostHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MapCostHeadRepository extends JpaRepository<MapCostHead, Long> {

    List<MapCostHead> findAllByOrderByCreatedAtDesc();

    List<MapCostHead> findByJobIdOrderByCreatedAtDesc(Long jobId);

    List<MapCostHead> findByActivityIdOrderByCreatedAtDesc(Long activityId);

    List<MapCostHead> findByStandardHeadIdOrderByCreatedAtDesc(Long standardHeadId);
}
