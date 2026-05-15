package com.arcadia.premium.repository;

import com.arcadia.premium.model.WalkIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface WalkInRepository extends JpaRepository<WalkIn, Long> {

    List<WalkIn> findByProjectNameOrderByVisitDateDesc(String projectName);

    List<WalkIn> findByVisitDateBetweenOrderByVisitDateDesc(LocalDate from, LocalDate to);

    List<WalkIn> findByProjectNameAndVisitDateBetweenOrderByVisitDateDesc(String projectName, LocalDate from, LocalDate to);

    List<WalkIn> findByStatusOrderByVisitDateDesc(String status);

    List<WalkIn> findByHandledByOrderByVisitDateDesc(String handledBy);

    long countBySource(String source);

    long countByStatus(String status);

    List<WalkIn> findAllByOrderByVisitDateDesc();

    @Query("SELECT COUNT(w) FROM WalkIn w WHERE w.visitDate BETWEEN :from AND :to")
    long countByVisitDateBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    List<WalkIn> findByNextFollowUpDateBetweenOrderByNextFollowUpDateAsc(LocalDate from, LocalDate to);
}
