package com.arcadia.premium.repository;

import com.arcadia.premium.model.SiteAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SiteAttendanceRepository extends JpaRepository<SiteAttendance, Long> {

    List<SiteAttendance> findBySubmittedByIdOrderByCreatedAtDesc(Long userId);

    // Legacy single-approver queries
    List<SiteAttendance> findByApproverIdAndStatusOrderByCreatedAtDesc(Long approverId, String status);
    List<SiteAttendance> findByApproverIdOrderByCreatedAtDesc(Long approverId);
    long countByApproverIdAndStatus(Long approverId, String status);

    List<SiteAttendance> findAllByOrderByCreatedAtDesc();

    List<SiteAttendance> findByStatusOrderByCreatedAtDesc(String status);

    /**
     * Find attendance records that are pending approval at a step matching the given role.
     * Used for multi-level approval: finds records where currentStepOrder matches
     * an approval step with the given approver role that is still PENDING.
     */
    @Query("SELECT DISTINCT a FROM SiteAttendance a " +
           "JOIN a.approvalSteps s " +
           "WHERE s.status = 'PENDING' " +
           "AND s.approverRoleName = :roleName " +
           "AND a.currentStepOrder = s.stepOrder " +
           "AND a.status IN ('PENDING', 'IN_APPROVAL') " +
           "ORDER BY a.createdAt DESC")
    List<SiteAttendance> findPendingByApproverRole(@Param("roleName") String roleName);

    @Query("SELECT COUNT(DISTINCT a) FROM SiteAttendance a " +
           "JOIN a.approvalSteps s " +
           "WHERE s.status = 'PENDING' " +
           "AND s.approverRoleName = :roleName " +
           "AND a.currentStepOrder = s.stepOrder " +
           "AND a.status IN ('PENDING', 'IN_APPROVAL')")
    long countPendingByApproverRole(@Param("roleName") String roleName);

    long countByApprovalChainId(Long approvalChainId);

    // ---- Report queries (all non-REJECTED records) ----

    @Query("SELECT a FROM SiteAttendance a WHERE a.status <> 'REJECTED' " +
           "AND a.attendanceDate BETWEEN :fromDate AND :toDate " +
           "ORDER BY a.attendanceDate DESC, a.siteName ASC")
    List<SiteAttendance> findAllBetweenDates(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("SELECT a FROM SiteAttendance a WHERE a.status <> 'REJECTED' " +
           "AND a.attendanceDate BETWEEN :fromDate AND :toDate " +
           "AND LOWER(a.siteName) = LOWER(:siteName) " +
           "ORDER BY a.attendanceDate DESC")
    List<SiteAttendance> findAllBetweenDatesAndSite(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("siteName") String siteName);

    @Query("SELECT DISTINCT a.siteName FROM SiteAttendance a WHERE a.status <> 'REJECTED' ORDER BY a.siteName")
    List<String> findDistinctAllSiteNames();

    // Filter by mastri leader
    @Query("SELECT a FROM SiteAttendance a WHERE a.status <> 'REJECTED' " +
           "AND a.attendanceDate BETWEEN :fromDate AND :toDate " +
           "AND a.mastriLeader.id = :leaderId " +
           "ORDER BY a.attendanceDate DESC")
    List<SiteAttendance> findByMastriLeader(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("leaderId") Long leaderId);

    // Filter by attendance type
    @Query("SELECT a FROM SiteAttendance a WHERE a.status <> 'REJECTED' " +
           "AND a.attendanceDate BETWEEN :fromDate AND :toDate " +
           "AND a.attendanceType = :attendanceType " +
           "ORDER BY a.attendanceDate DESC")
    List<SiteAttendance> findByType(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("attendanceType") String attendanceType);
}
