package com.arcadia.premium.repository;

import com.arcadia.premium.model.DailyExecutionUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DailyExecutionUpdateRepository extends JpaRepository<DailyExecutionUpdate, Long> {

    List<DailyExecutionUpdate> findByExecutionTaskIdOrderByUpdateDateDesc(Long executionTaskId);

    List<DailyExecutionUpdate> findAllByOrderByCreatedAtDesc();
}
