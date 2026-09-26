package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateTodoTaskRequest;
import com.arcadia.premium.dto.TodoTaskDto;
import com.arcadia.premium.model.TodoTask;
import com.arcadia.premium.model.User;
import com.arcadia.premium.repository.TodoTaskRepository;
import com.arcadia.premium.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TodoTaskService {

    private static final Logger log = LoggerFactory.getLogger(TodoTaskService.class);

    private final TodoTaskRepository todoTaskRepo;
    private final UserRepository userRepository;

    public TodoTaskService(TodoTaskRepository todoTaskRepo, UserRepository userRepository) {
        this.todoTaskRepo = todoTaskRepo;
        this.userRepository = userRepository;
    }

    /** Create a new todo task */
    @Transactional
    public TodoTaskDto create(CreateTodoTaskRequest req, String currentUserEmail) {
        TodoTask task = new TodoTask();
        task.setTaskCode(generateNextTaskCode());
        task.setTitle(req.getTitle());
        task.setDescription(req.getDescription());
        task.setCategory(req.getCategory());
        task.setPriority(req.getPriority());
        task.setStatus("PENDING");
        task.setTargetDate(req.getTargetDate());
        task.setProject(req.getProject());
        task.setAssignedTo(req.getAssignedTo());
        task.setAssignedBy(currentUserEmail);
        task.setRemarks(req.getRemarks());
        task.setReminderEnabled(req.getReminderEnabled() != null ? req.getReminderEnabled() : true);

        // Resolve display names
        userRepository.findByEmail(req.getAssignedTo()).ifPresent(u ->
            task.setAssignedToName(u.getFirstName() + " " + u.getLastName()));
        userRepository.findByEmail(currentUserEmail).ifPresent(u ->
            task.setAssignedByName(u.getFirstName() + " " + u.getLastName()));

        return TodoTaskDto.fromEntity(todoTaskRepo.save(task));
    }

    /** Update an existing task */
    @Transactional
    public TodoTaskDto update(Long id, CreateTodoTaskRequest req) {
        TodoTask task = todoTaskRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));

        if (req.getTitle() != null) task.setTitle(req.getTitle());
        if (req.getDescription() != null) task.setDescription(req.getDescription());
        if (req.getCategory() != null) task.setCategory(req.getCategory());
        if (req.getPriority() != null) task.setPriority(req.getPriority());
        if (req.getTargetDate() != null) task.setTargetDate(req.getTargetDate());
        if (req.getProject() != null) task.setProject(req.getProject());
        if (req.getRemarks() != null) task.setRemarks(req.getRemarks());
        if (req.getReminderEnabled() != null) task.setReminderEnabled(req.getReminderEnabled());

        if (req.getAssignedTo() != null && !req.getAssignedTo().equals(task.getAssignedTo())) {
            task.setAssignedTo(req.getAssignedTo());
            userRepository.findByEmail(req.getAssignedTo()).ifPresent(u ->
                task.setAssignedToName(u.getFirstName() + " " + u.getLastName()));
        }

        return TodoTaskDto.fromEntity(todoTaskRepo.save(task));
    }

    /** Update task status */
    @Transactional
    public TodoTaskDto updateStatus(Long id, String status) {
        TodoTask task = todoTaskRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
        task.setStatus(status);

        if ("COMPLETED".equals(status)) {
            task.setActualCompletionDate(LocalDate.now());
        } else {
            task.setActualCompletionDate(null);
        }

        return TodoTaskDto.fromEntity(todoTaskRepo.save(task));
    }

    /** Update daily progress note */
    @Transactional
    public TodoTaskDto updateDailyUpdate(Long id, String dailyUpdate) {
        TodoTask task = todoTaskRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
        task.setDailyUpdate(dailyUpdate);
        task.setDailyUpdateAt(LocalDateTime.now());
        return TodoTaskDto.fromEntity(todoTaskRepo.save(task));
    }

    /** Get tasks assigned to a user */
    public List<TodoTaskDto> getMyTasks(String email) {
        return todoTaskRepo.findByAssignedToOrderByTargetDateAsc(email)
                .stream().map(TodoTaskDto::fromEntity).toList();
    }

    /** Get tasks assigned by a user */
    public List<TodoTaskDto> getAssignedByMe(String email) {
        return todoTaskRepo.findByAssignedByOrderByTargetDateAsc(email)
                .stream().map(TodoTaskDto::fromEntity).toList();
    }

    /** Get all tasks (admin view) */
    public List<TodoTaskDto> getAll() {
        return todoTaskRepo.findAllByOrderByTargetDateAsc()
                .stream().map(TodoTaskDto::fromEntity).toList();
    }

    /** Get a single task by ID */
    public TodoTaskDto getById(Long id) {
        return todoTaskRepo.findById(id)
                .map(TodoTaskDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
    }

    /** Delete a task */
    @Transactional
    public void delete(Long id) {
        todoTaskRepo.deleteById(id);
    }

    /** Get overdue tasks */
    public List<TodoTaskDto> getOverdueTasks() {
        return todoTaskRepo.findOverdueTasks(LocalDate.now())
                .stream().map(TodoTaskDto::fromEntity).toList();
    }

    /** Auto-mark overdue tasks — called by scheduler */
    @Transactional
    public void markOverdueTasks() {
        LocalDate today = LocalDate.now();
        List<TodoTask> tasks = todoTaskRepo.findOverdueTasks(today);
        for (TodoTask task : tasks) {
            if (!"OVERDUE".equals(task.getStatus())) {
                task.setStatus("OVERDUE");
                todoTaskRepo.save(task);
                log.info("Marked task {} as OVERDUE (target: {})", task.getTaskCode(), task.getTargetDate());
            }
        }
    }

    /** Get tasks needing daily reminder — pending/in-progress with target date <= today */
    public List<TodoTask> getTasksForDailyReminder() {
        return todoTaskRepo.findTasksForDailyReminder(LocalDate.now());
    }

    /** Get tasks completed in a date range (for weekly summary) */
    public List<TodoTaskDto> getCompletedInRange(LocalDate start, LocalDate end) {
        return todoTaskRepo.findCompletedInRange(start, end)
                .stream().map(TodoTaskDto::fromEntity).toList();
    }

    /** Get all pending tasks (for weekly summary) */
    public List<TodoTaskDto> getAllPendingTasks() {
        return todoTaskRepo.findAllPendingTasks()
                .stream().map(TodoTaskDto::fromEntity).toList();
    }

    /** Get active tasks for a specific user (for reminders) */
    public List<TodoTask> getActiveTasksForUser(String email) {
        return todoTaskRepo.findActiveTasksForUser(email);
    }

    private String generateNextTaskCode() {
        return todoTaskRepo.findFirstByOrderByIdDesc()
                .map(task -> {
                    int num = Integer.parseInt(task.getTaskCode().replace("TODO-", ""));
                    return String.format("TODO-%03d", num + 1);
                })
                .orElse("TODO-001");
    }
}
