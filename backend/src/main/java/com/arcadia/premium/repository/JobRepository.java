package com.arcadia.premium.repository;

import com.arcadia.premium.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findAllByOrderByCreatedAtDesc();

    List<Job> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<Job> findByStatusOrderByCreatedAtDesc(String status);
}
