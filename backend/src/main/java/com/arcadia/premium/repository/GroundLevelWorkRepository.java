package com.arcadia.premium.repository;

import com.arcadia.premium.model.GroundLevelWork;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroundLevelWorkRepository extends JpaRepository<GroundLevelWork, Long> {

    List<GroundLevelWork> findByProjectNameOrderByCreatedAtDesc(String projectName);

    List<GroundLevelWork> findByProjectNameAndBillMonthOrderByCreatedAtDesc(String projectName, String billMonth);

    List<GroundLevelWork> findAllByOrderByCreatedAtDesc();
}
