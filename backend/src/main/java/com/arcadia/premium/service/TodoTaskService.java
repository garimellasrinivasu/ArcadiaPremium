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
import java.util.*;

@Service
public class TodoTaskService {

    private static final Logger log = LoggerFactory.getLogger(TodoTaskService.class);

    private final TodoTaskRepository todoTaskRepo;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager em;
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

    // ── Import (e.g. moving tasks from the local app to production) ──

    private static final Set<String> CATEGORY_SET = Set.of("CONSTRUCTION", "LEGAL", "FINANCE", "ADMIN");
    private static final Set<String> PRIORITY_SET = Set.of("HIGH", "MEDIUM", "LOW");
    private static final Set<String> STATUS_SET = Set.of("PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE");

    /**
     * Imports exported task rows. A row matches an existing task when the title and project are the same
     * (ignoring case and spaces); matches are updated, everything else is created with a new task code.
     * With dryRun nothing is saved — the result says what would happen.
     */
    @Transactional
    public Map<String, Object> importTasks(List<Map<String, Object>> rows, boolean dryRun, String currentUserEmail) {
        List<TodoTask> existing = todoTaskRepo.findAll();
        int created = 0, updated = 0, unchanged = 0, skipped = 0;
        List<Map<String, Object>> results = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        Set<String> unknownUsers = new TreeSet<>();
        Set<String> seen = new HashSet<>();
        int rowNo = 1;
        for (Map<String, Object> r : rows) {
            rowNo++;
            String title = str(r.get("title"));
            String project = str(r.get("project"));
            String action;
            String note = null;
            if (title == null) { skipped++; results.add(Map.of("row", rowNo, "title", "", "action", "SKIPPED", "note", "No title")); continue; }
            LocalDate target = parseDate(r.get("targetDate"));
            String key = norm(title) + "|" + norm(project);
            if (!seen.add(key)) { skipped++; results.add(Map.of("row", rowNo, "title", title, "action", "SKIPPED", "note", "Duplicate row in file")); continue; }

            TodoTask t = existing.stream()
                    .filter(e -> norm(e.getTitle()).equals(norm(title)) && norm(e.getProject()).equals(norm(project)))
                    .findFirst().orElse(null);
            boolean isNew = t == null;
            if (isNew) {
                if (target == null) { skipped++; results.add(Map.of("row", rowNo, "title", title, "action", "SKIPPED", "note", "Target date missing or not a date")); continue; }
                t = new TodoTask();
                t.setTitle(title);
                t.setProject(project);
            }
            String before = fingerprint(t);

            String assignedTo = lower(str(r.get("assignedTo")));
            if (assignedTo == null) assignedTo = isNew ? currentUserEmail : t.getAssignedTo();
            String assignedBy = lower(str(r.get("assignedBy")));
            if (assignedBy == null) assignedBy = isNew ? currentUserEmail : t.getAssignedBy();
            t.setDescription(str(r.get("description")));
            t.setCategory(pick(r.get("category"), CATEGORY_SET, isNew ? "ADMIN" : t.getCategory()));
            t.setPriority(pick(r.get("priority"), PRIORITY_SET, isNew ? "MEDIUM" : t.getPriority()));
            t.setStatus(pick(r.get("status"), STATUS_SET, isNew ? "PENDING" : t.getStatus()));
            if (target != null) t.setTargetDate(target);
            t.setActualCompletionDate(parseDate(r.get("actualCompletionDate")));
            if ("COMPLETED".equals(t.getStatus()) && t.getActualCompletionDate() == null) t.setActualCompletionDate(t.getTargetDate());
            t.setRemarks(str(r.get("remarks")));
            String daily = str(r.get("dailyUpdate"));
            if (!Objects.equals(daily, str(t.getDailyUpdate()))) { t.setDailyUpdate(daily); t.setDailyUpdateAt(daily == null ? null : LocalDateTime.now()); }
            Object rem = r.get("reminderEnabled");
            if (rem != null && !String.valueOf(rem).isBlank()) t.setReminderEnabled(parseBool(rem));
            if (!assignedTo.equalsIgnoreCase(Objects.toString(t.getAssignedTo(), ""))) {
                t.setAssignedTo(assignedTo);
                t.setAssignedToName(displayName(assignedTo, str(r.get("assignedToName"))));
            }
            if (!assignedBy.equalsIgnoreCase(Objects.toString(t.getAssignedBy(), ""))) {
                t.setAssignedBy(assignedBy);
                t.setAssignedByName(displayName(assignedBy, str(r.get("assignedByName"))));
            }
            if (userRepository.findByEmail(assignedTo).isEmpty()) unknownUsers.add(assignedTo);

            if (isNew) { action = "CREATE"; created++; }
            else if (before.equals(fingerprint(t))) { action = "UNCHANGED"; unchanged++; em.detach(t); /* don't save whitespace-only edits */ }
            else { action = "UPDATE"; updated++; note = "Matches " + t.getTaskCode(); }

            if (!dryRun && !"UNCHANGED".equals(action)) {
                if (isNew) { t.setTaskCode(generateNextTaskCode()); existing.add(t); }
                todoTaskRepo.saveAndFlush(t);
            }
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("row", rowNo); res.put("title", title); res.put("action", action);
            if (note != null) res.put("note", note);
            results.add(res);
        }
        if (dryRun) {
            // nothing must be written by a preview
            org.springframework.transaction.interceptor.TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }
        if (!unknownUsers.isEmpty()) warnings.add("These assignees have no user account here (tasks are still imported, but they can't log in to see them): " + String.join(", ", unknownUsers));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("dryRun", dryRun);
        out.put("created", created); out.put("updated", updated); out.put("unchanged", unchanged); out.put("skipped", skipped);
        out.put("warnings", warnings);
        out.put("rows", results);
        return out;
    }

    private String displayName(String email, String fallback) {
        return userRepository.findByEmail(email).map(u -> u.getFirstName() + " " + u.getLastName()).orElse(fallback);
    }

    /** Compares the imported fields, ignoring surrounding spaces and empty-vs-missing text. */
    private static String fingerprint(TodoTask t) {
        return String.join("|", Objects.toString(str(t.getDescription())), Objects.toString(t.getCategory()), Objects.toString(t.getPriority()),
                Objects.toString(t.getStatus()), Objects.toString(t.getTargetDate()), Objects.toString(t.getActualCompletionDate()),
                Objects.toString(str(t.getRemarks())), Objects.toString(str(t.getDailyUpdate())), Objects.toString(t.getReminderEnabled()),
                Objects.toString(lower(str(t.getAssignedTo()))), Objects.toString(lower(str(t.getAssignedBy()))));
    }

    private static String str(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }

    private static String lower(String s) { return s == null ? null : s.toLowerCase(Locale.ROOT); }

    private static String norm(String s) { return s == null ? "" : s.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT); }

    private static String pick(Object raw, Set<String> allowed, String fallback) {
        String v = str(raw);
        if (v == null) return fallback;
        v = v.toUpperCase(Locale.ROOT).replace(' ', '_');
        return allowed.contains(v) ? v : fallback;
    }

    private static boolean parseBool(Object o) {
        String s = String.valueOf(o).trim().toLowerCase(Locale.ROOT);
        return s.equals("true") || s.equals("yes") || s.equals("y") || s.equals("1");
    }

    private static LocalDate parseDate(Object o) {
        String s = str(o);
        if (s == null) return null;
        for (String f : new String[]{"yyyy-MM-dd", "dd-MM-yyyy", "dd/MM/yyyy", "dd-MMM-yyyy"}) {
            try { return LocalDate.parse(s, java.time.format.DateTimeFormatter.ofPattern(f, Locale.ENGLISH)); } catch (Exception ignored) {}
        }
        return null;
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
