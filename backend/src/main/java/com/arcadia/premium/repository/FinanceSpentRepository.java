package com.arcadia.premium.repository;

import com.arcadia.premium.model.FinanceSpent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface FinanceSpentRepository extends JpaRepository<FinanceSpent, Long> {

    List<FinanceSpent> findBySpentDateBetweenOrderBySpentDateDesc(LocalDate from, LocalDate to);

    List<FinanceSpent> findByProjectNameAndSpentDateBetweenOrderBySpentDateDesc(String projectName, LocalDate from, LocalDate to);

    List<FinanceSpent> findBySubmittedByEmailOrderBySpentDateDesc(String email);

    List<FinanceSpent> findByStatusOrderBySpentDateDesc(String status);

    List<FinanceSpent> findAllByOrderBySpentDateDesc();

    @Query("SELECT DISTINCT f.paidBy FROM FinanceSpent f WHERE f.paidBy IS NOT NULL ORDER BY f.paidBy")
    List<String> findDistinctPaidBy();

    @Query("SELECT DISTINCT f.paidTo FROM FinanceSpent f WHERE f.paidTo IS NOT NULL ORDER BY f.paidTo")
    List<String> findDistinctPaidTo();

    @Query("SELECT DISTINCT f.description FROM FinanceSpent f WHERE f.description IS NOT NULL AND f.description <> '' ORDER BY f.description")
    List<String> findDistinctDescriptions();
}
