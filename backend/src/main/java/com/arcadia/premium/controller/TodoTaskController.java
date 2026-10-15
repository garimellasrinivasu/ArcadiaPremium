package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateTodoTaskRequest;
import com.arcadia.premium.dto.TodoTaskDto;
import com.arcadia.premium.service.TodoTaskService;
import com.arcadia.premium.service.TodoTaskScheduler;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/todo-tasks")
public class TodoTaskController {

    private final TodoTaskService todoTaskService;
    private final TodoTaskScheduler todoTaskScheduler;

    public TodoTaskController(TodoTaskService todoTaskService, TodoTaskScheduler todoTaskScheduler) {
        this.todoTaskService = todoTaskService;
        this.todoTaskScheduler = todoTaskScheduler;
    }

    /** Create a new task */
    @PostMapping
    public ResponseEntity<TodoTaskDto> create(@Valid @RequestBody CreateTodoTaskRequest request) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(todoTaskService.create(request, email));
    }

    /** Update a task */
    @PutMapping("/{id}")
    public ResponseEntity<TodoTaskDto> update(@PathVariable Long id,
                                               @RequestBody CreateTodoTaskRequest request) {
        return ResponseEntity.ok(todoTaskService.update(id, request));
    }

    /** Update task status */
    @PatchMapping("/{id}/status")
    public ResponseEntity<TodoTaskDto> updateStatus(@PathVariable Long id,
                                                     @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(todoTaskService.updateStatus(id, status));
    }

    /** Update daily progress note */
    @PatchMapping("/{id}/daily-update")
    public ResponseEntity<TodoTaskDto> updateDailyUpdate(@PathVariable Long id,
                                                          @RequestBody Map<String, String> body) {
        String dailyUpdate = body.get("dailyUpdate");
        return ResponseEntity.ok(todoTaskService.updateDailyUpdate(id, dailyUpdate));
    }

    /** Get tasks assigned to current user */
    @GetMapping("/my-tasks")
    public ResponseEntity<List<TodoTaskDto>> getMyTasks() {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(todoTaskService.getMyTasks(email));
    }

    /** Get tasks assigned by current user */
    @GetMapping("/assigned-by-me")
    public ResponseEntity<List<TodoTaskDto>> getAssignedByMe() {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(todoTaskService.getAssignedByMe(email));
    }

    /** Get all tasks (admin view) */
    @GetMapping
    public ResponseEntity<List<TodoTaskDto>> getAll() {
        return ResponseEntity.ok(todoTaskService.getAll());
    }

    /** Get a single task */
    @GetMapping("/{id}")
    public ResponseEntity<TodoTaskDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(todoTaskService.getById(id));
    }

    /** Delete a task */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        todoTaskService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
    }

    /** Get overdue tasks */
    @GetMapping("/overdue")
    public ResponseEntity<List<TodoTaskDto>> getOverdue() {
        return ResponseEntity.ok(todoTaskService.getOverdueTasks());
    }

    /**
     * Import tasks exported from another environment (admin only).
     * Body: {"rows": [...], "dryRun": true|false}. Run with dryRun first to preview.
     */
    @PostMapping("/import")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> importTasks(@RequestBody Map<String, Object> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean admin = auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!admin) return ResponseEntity.status(403).body(Map.of("message", "Only admins can import tasks"));
        Object rows = body.get("rows");
        if (!(rows instanceof List<?> list)) return ResponseEntity.badRequest().body(Map.of("message", "No rows to import"));
        if (list.size() > 5000) return ResponseEntity.badRequest().body(Map.of("message", "Too many rows (max 5000)"));
        boolean dryRun = !Boolean.FALSE.equals(body.get("dryRun"));
        return ResponseEntity.ok(todoTaskService.importTasks((List<Map<String, Object>>) list, dryRun, auth.getName()));
    }

    /** Test: Trigger daily reminder manually */
    @PostMapping("/test/daily-reminder")
    public ResponseEntity<Map<String, String>> testDailyReminder() {
        String result = todoTaskScheduler.dailyReminder();
        return ResponseEntity.ok(Map.of("message", result));
    }

    /** Test: Trigger weekly summary manually */
    @PostMapping("/test/weekly-summary")
    public ResponseEntity<Map<String, String>> testWeeklySummary() {
        String result = todoTaskScheduler.weeklySummary();
        return ResponseEntity.ok(Map.of("message", result));
    }

    private String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}
