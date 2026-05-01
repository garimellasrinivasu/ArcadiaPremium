package com.arcadia.premium.controller;

import com.arcadia.premium.dto.AttendanceReportDto;
import com.arcadia.premium.service.AttendanceExportService;
import com.arcadia.premium.service.AttendanceReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/attendance-reports")
@PreAuthorize("hasAnyRole('ADMIN', 'PARTNER', 'ACCOUNTING')")
public class AttendanceReportController {

    private final AttendanceReportService reportService;
    private final AttendanceExportService exportService;

    public AttendanceReportController(AttendanceReportService reportService,
                                       AttendanceExportService exportService) {
        this.reportService = reportService;
        this.exportService = exportService;
    }

    /**
     * Get report data (JSON) for the given date range and optional site filter.
     */
    @GetMapping
    public ResponseEntity<AttendanceReportDto> getReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String siteName) {
        return ResponseEntity.ok(reportService.generateReport(fromDate, toDate, siteName));
    }

    /**
     * Get list of distinct site names (for filter dropdown).
     */
    @GetMapping("/sites")
    public ResponseEntity<List<String>> getSiteNames() {
        return ResponseEntity.ok(reportService.getApprovedSiteNames());
    }

    /**
     * Download report as Excel (.xlsx).
     */
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String siteName) throws IOException {
        AttendanceReportDto report = reportService.generateReport(fromDate, toDate, siteName);
        byte[] data = exportService.exportToExcel(report);

        String filename = "attendance_report_" +
                fromDate.format(DateTimeFormatter.BASIC_ISO_DATE) + "_" +
                toDate.format(DateTimeFormatter.BASIC_ISO_DATE) + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    /**
     * Download report as PDF.
     */
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String siteName) {
        AttendanceReportDto report = reportService.generateReport(fromDate, toDate, siteName);
        byte[] data = exportService.exportToPdf(report);

        String filename = "attendance_report_" +
                fromDate.format(DateTimeFormatter.BASIC_ISO_DATE) + "_" +
                toDate.format(DateTimeFormatter.BASIC_ISO_DATE) + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
