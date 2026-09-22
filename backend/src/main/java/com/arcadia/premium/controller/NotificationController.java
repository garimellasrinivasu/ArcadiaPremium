package com.arcadia.premium.controller;

import com.arcadia.premium.dto.NotificationConfigDto;
import com.arcadia.premium.service.NotificationService;
import com.arcadia.premium.service.SummaryImageGenerator;
import com.arcadia.premium.service.WorkExecutionReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final WorkExecutionReportService reportService;
    private final SummaryImageGenerator summaryImageGenerator;

    public NotificationController(NotificationService notificationService,
                                   WorkExecutionReportService reportService,
                                   SummaryImageGenerator summaryImageGenerator) {
        this.notificationService = notificationService;
        this.reportService = reportService;
        this.summaryImageGenerator = summaryImageGenerator;
    }

    // --- Config CRUD ---

    @GetMapping("/config")
    public ResponseEntity<List<NotificationConfigDto>> getConfigs(
            @RequestParam(required = false) String projectName) {
        if (projectName != null && !projectName.isEmpty()) {
            return ResponseEntity.ok(notificationService.getConfigs(projectName));
        }
        return ResponseEntity.ok(notificationService.getAllConfigs());
    }

    @PostMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotificationConfigDto> addConfig(@RequestBody NotificationConfigDto dto) {
        return ResponseEntity.ok(notificationService.addConfig(dto));
    }

    @PutMapping("/config/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotificationConfigDto> updateConfig(@PathVariable Long id,
                                                                @RequestBody NotificationConfigDto dto) {
        return ResponseEntity.ok(notificationService.updateConfig(id, dto));
    }

    @DeleteMapping("/config/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteConfig(@PathVariable Long id) {
        notificationService.deleteConfig(id);
        return ResponseEntity.ok(Map.of("message", "Config deleted"));
    }

    // --- Send Notifications ---

    @PostMapping("/send")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> sendSummary(@RequestParam String projectName) {
        return ResponseEntity.ok(notificationService.sendSummary(projectName));
    }

    // --- Test Email ---

    @PostMapping("/test-email")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> sendTestEmail(@RequestParam String toAddress) {
        return ResponseEntity.ok(notificationService.sendTestEmail(toAddress));
    }

    // --- Status ---

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(notificationService.getStatus());
    }

    // --- Download Reports ---

    @GetMapping("/report/excel")
    public ResponseEntity<byte[]> downloadExcel(@RequestParam String projectName) {
        byte[] excel = reportService.generateExcel(projectName);
        String fileName = "WorkExecution_" + projectName.replaceAll("\\s+", "_") + "_"
                + LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")) + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }

    @GetMapping("/report/summary")
    public ResponseEntity<Map<String, Object>> getSummary(@RequestParam String projectName) {
        return ResponseEntity.ok(reportService.generateSummary(projectName));
    }

    @GetMapping("/report/villa-status-excel")
    public ResponseEntity<byte[]> downloadVillaStatusExcel(@RequestParam String projectName) {
        byte[] excel = reportService.generateVillaWiseExcel(projectName);
        String fileName = "VillaWise_Status_" + projectName.replaceAll("\\s+", "_") + "_"
                + LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")) + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }

    @GetMapping("/report/summary-image")
    public ResponseEntity<byte[]> downloadSummaryImage(@RequestParam String projectName) {
        byte[] image = summaryImageGenerator.generateSummaryImage(projectName);
        String fileName = "WorkExecution_Summary_" + projectName.replaceAll("\\s+", "_") + "_"
                + LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")) + ".png";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .contentType(MediaType.IMAGE_PNG)
                .body(image);
    }
}
