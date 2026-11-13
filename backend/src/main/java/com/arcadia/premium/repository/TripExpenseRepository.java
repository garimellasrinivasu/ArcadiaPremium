package com.arcadia.premium.repository;

import com.arcadia.premium.model.TripExpense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TripExpenseRepository extends JpaRepository<TripExpense, Long> {
    List<TripExpense> findByTripOrderByExpenseDateDescIdDesc(String trip);
}
