package com.arcadia.premium.controller;

import com.arcadia.premium.service.WorkPlanReportService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/** Planned vs completed reports (day / week / month) and the daily / weekly work-plan emails. */
@RestController
@RequestMapping("/api/villa-construction/plan")
public class WorkPlanReportController {

    private final WorkPlanReportService service;

    public WorkPlanReportController(WorkPlanReportService service) {
        this.service = service;
    }

    @GetMapping("/report")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'WORK_EXECUTION')")
    public ResponseEntity<?> report(@RequestParam String projectName, @RequestParam String from, @RequestParam String to) {
        try {
            LocalDate f = LocalDate.parse(from), t = LocalDate.parse(to);
            if (t.toEpochDay() - f.toEpochDay() > 400) throw new IllegalArgumentException("Choose a period of at most a year");
            return ResponseEntity.ok(service.report(projectName, f, t));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Report failed"));
        }
    }

    @GetMapping("/mail-config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> mailConfig(@RequestParam String projectName) {
        return ResponseEntity.ok(service.mailConfig(projectName));
    }

    @PutMapping("/mail-config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> saveMailConfig(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(service.saveMailConfig((String) body.get("projectName"), (String) body.get("recipients"),
                    Boolean.TRUE.equals(body.get("dailyEnabled")), Boolean.TRUE.equals(body.get("weeklyEnabled"))));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping(value = "/mail-preview", produces = MediaType.TEXT_HTML_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> preview(@RequestParam String projectName, @RequestParam(defaultValue = "daily") String type) {
        return ResponseEntity.ok(service.mailHtml(projectName, type));
    }

    /** The work plan as a PNG (same picture that is attached to the emails). */
    @GetMapping(value = "/mail-image", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'WORK_EXECUTION')")
    public ResponseEntity<byte[]> image(@RequestParam String projectName, @RequestParam(defaultValue = "daily") String type) {
        return ResponseEntity.ok(service.mailImage(projectName, "weekly".equals(type) ? "weekly" : "daily"));
    }

    @PostMapping("/send")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> send(@RequestParam String projectName, @RequestParam(defaultValue = "daily") String type) {
        try {
            return ResponseEntity.ok(Map.of("message", service.send(projectName, "weekly".equals(type) ? "weekly" : "daily", "sent now")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
