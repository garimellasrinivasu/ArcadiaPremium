package com.arcadia.premium.repository;

import com.arcadia.premium.model.TodoTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TodoTaskRepository extends JpaRepository<TodoTask, Long> {

    /** Find tasks assigned TO a specific user, ordered by target date */
    List<TodoTask> findByAssignedToOrderByTargetDateAsc(String assignedTo);

    /** Find tasks assigned BY a specific user, ordered by target date */
    List<TodoTask> findByAssignedByOrderByTargetDateAsc(String assignedBy);

    /** Get all tasks ordered by target date */
    List<TodoTask> findAllByOrderByTargetDateAsc();

    /** Find tasks by status */
    List<TodoTask> findByStatusOrderByTargetDateAsc(String status);

    /** Find overdue tasks (target date past, not completed) */
    @Query("SELECT t FROM TodoTask t WHERE t.targetDate < :today AND t.status <> 'COMPLETED' ORDER BY t.targetDate ASC")
    List<TodoTask> findOverdueTasks(@Param("today") LocalDate today);

    /** Find pending/in-progress tasks due today or overdue (for daily reminders) */
    @Query("SELECT t FROM TodoTask t WHERE t.targetDate <= :today AND t.status IN ('PENDING', 'IN_PROGRESS') AND t.reminderEnabled = true ORDER BY t.targetDate ASC")
    List<TodoTask> findTasksForDailyReminder(@Param("today") LocalDate today);

    /** Find tasks completed in a date range (for weekly summary) */
    @Query("SELECT t FROM TodoTask t WHERE t.actualCompletionDate BETWEEN :startDate AND :endDate ORDER BY t.actualCompletionDate ASC")
    List<TodoTask> findCompletedInRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /** Find all non-completed tasks (for weekly summary) */
    @Query("SELECT t FROM TodoTask t WHERE t.status <> 'COMPLETED' ORDER BY t.targetDate ASC")
    List<TodoTask> findAllPendingTasks();

    /** Get the latest task to generate next code */
    Optional<TodoTask> findFirstByOrderByIdDesc();

    /** Find tasks by project */
    List<TodoTask> findByProjectOrderByTargetDateAsc(String project);

    /** Find tasks assigned to a user that are pending or in-progress with reminders enabled */
    @Query("SELECT t FROM TodoTask t WHERE t.assignedTo = :email AND t.status IN ('PENDING', 'IN_PROGRESS') AND t.reminderEnabled = true ORDER BY t.targetDate ASC")
    List<TodoTask> findActiveTasksForUser(@Param("email") String email);

    /** Find tasks with target date = today and not completed (today's completable tasks) */
    @Query("SELECT t FROM TodoTask t WHERE t.targetDate = :today AND t.status <> 'COMPLETED' ORDER BY t.priority ASC")
    List<TodoTask> findTodaysTasks(@Param("today") LocalDate today);
}
