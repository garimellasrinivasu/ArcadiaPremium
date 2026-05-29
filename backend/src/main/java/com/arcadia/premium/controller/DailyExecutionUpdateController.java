package com.arcadia.premium.controller;

import com.arcadia.premium.dto.DailyExecutionUpdateDto;
import com.arcadia.premium.service.DailyExecutionUpdateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/daily-execution-updates")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SUPERVISOR') or @pageAccess.hasAccess(authentication, 'DAILY_EXECUTION_UPDATE')")
public class DailyExecutionUpdateController {

    private final DailyExecutionUpdateService service;

    public DailyExecutionUpdateController(DailyExecutionUpdateService service) {
        this.service = service;
    }

    /** Record a daily progress update */
    @PostMapping
    public ResponseEntity<DailyExecutionUpdateDto> recordUpdate(
            @RequestBody Map<String, Object> req,
            Authentication auth) {
        return ResponseEntity.ok(service.recordUpdate(req, auth.getName()));
    }

    @GetMapping("/by-task/{taskId}")
    public ResponseEntity<List<DailyExecutionUpdateDto>> getByTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(service.getByTask(taskId));
    }

    @GetMapping
    public ResponseEntity<List<DailyExecutionUpdateDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }
}
