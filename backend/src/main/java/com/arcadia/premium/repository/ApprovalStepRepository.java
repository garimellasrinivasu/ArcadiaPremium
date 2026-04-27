package com.arcadia.premium.repository;

import com.arcadia.premium.model.ApprovalStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ApprovalStepRepository extends JpaRepository<ApprovalStep, Long> {

    List<ApprovalStep> findByAttendanceIdOrderByStepOrderAsc(Long attendanceId);

    Optional<ApprovalStep> findByAttendanceIdAndStepOrder(Long attendanceId, int stepOrder);

    /**
     * Find PENDING approval steps assigned to a specific user
     * where the attendance record is at that step.
     */
    @Query("SELECT s FROM ApprovalStep s " +
           "JOIN s.attendance a " +
           "WHERE s.status = 'PENDING' " +
           "AND s.assignedTo.id = :userId " +
           "AND a.currentStepOrder = s.stepOrder " +
           "AND a.status IN ('PENDING', 'IN_APPROVAL') " +
           "ORDER BY a.createdAt DESC")
    List<ApprovalStep> findPendingStepsAssignedToUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(s) FROM ApprovalStep s " +
           "JOIN s.attendance a " +
           "WHERE s.status = 'PENDING' " +
           "AND s.assignedTo.id = :userId " +
           "AND a.currentStepOrder = s.stepOrder " +
           "AND a.status IN ('PENDING', 'IN_APPROVAL')")
    long countPendingAssignedToUser(@Param("userId") Long userId);
}
