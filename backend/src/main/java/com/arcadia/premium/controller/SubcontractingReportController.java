package com.arcadia.premium.controller;

import com.arcadia.premium.service.SubcontractingReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subcontracting-reports")
@PreAuthorize("hasAnyRole('ADMIN','PARTNER','SUPERVISOR') or @pageAccess.hasAccess(authentication, 'WO_REPORTS')")
public class SubcontractingReportController {

    private final SubcontractingReportService reportService;

    public SubcontractingReportController(SubcontractingReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/work-orders")
    public ResponseEntity<List<Map<String, Object>>> getWorkOrderReport(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long contractorId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(reportService.getWorkOrderReport(projectId, contractorId, status));
    }

    @GetMapping("/contractor-bills")
    public ResponseEntity<List<Map<String, Object>>> getContractorBillReport(
            @RequestParam(required = false) Long contractorId) {
        return ResponseEntity.ok(reportService.getContractorBillReport(contractorId));
    }

    @GetMapping("/wo-by-unit")
    public ResponseEntity<List<Map<String, Object>>> getWOReportByUnit(
            @RequestParam(required = false) Long projectId) {
        return ResponseEntity.ok(reportService.getWOReportByUnit(projectId));
    }

    @GetMapping("/wo-by-activity")
    public ResponseEntity<List<Map<String, Object>>> getWOReportByActivity(
            @RequestParam(required = false) Long jobId) {
        return ResponseEntity.ok(reportService.getWOReportByActivity(jobId));
    }

    @GetMapping("/mb-by-activity")
    public ResponseEntity<List<Map<String, Object>>> getMBReportByActivity(
            @RequestParam(required = false) Long workOrderId) {
        return ResponseEntity.ok(reportService.getMBReportByActivity(workOrderId));
    }

    @GetMapping("/bill-approval-history")
    public ResponseEntity<List<Map<String, Object>>> getBillApprovalHistory(
            @RequestParam(required = false) Long contractorId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(reportService.getBillApprovalHistory(contractorId, status));
    }
}
