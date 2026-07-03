package com.arcadia.premium.repository;

import com.arcadia.premium.model.PujaExpense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PujaExpenseRepository extends JpaRepository<PujaExpense, Long> {

    List<PujaExpense> findByPujaNameOrderByCreatedAtDesc(String pujaName);

    List<PujaExpense> findByProjectNameOrderByCreatedAtDesc(String projectName);

    List<PujaExpense> findAllByOrderByCreatedAtDesc();
}
