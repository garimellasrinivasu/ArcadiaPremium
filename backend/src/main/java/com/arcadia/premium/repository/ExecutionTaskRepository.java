package com.arcadia.premium.repository;

import com.arcadia.premium.model.ExecutionTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExecutionTaskRepository extends JpaRepository<ExecutionTask, Long> {

    List<ExecutionTask> findAllByOrderByCreatedAtDesc();

    List<ExecutionTask> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<ExecutionTask> findByAssignedToOrderByCreatedAtDesc(String assignedTo);

    List<ExecutionTask> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT MAX(e.taskCode) FROM ExecutionTask e")
    Optional<String> findMaxTaskCode();
}
