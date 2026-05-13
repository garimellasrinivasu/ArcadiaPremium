package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateFinanceSpentRequest;
import com.arcadia.premium.dto.FinanceSpentDto;
import com.arcadia.premium.service.FinanceSpentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance-spent")
public class FinanceSpentController {

    private final FinanceSpentService service;

    public FinanceSpentController(FinanceSpentService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<FinanceSpentDto> create(
            @RequestBody CreateFinanceSpentRequest req,
            Authentication auth) {
        return ResponseEntity.ok(service.create(req, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<FinanceSpentDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FinanceSpentDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/my-submissions")
    public ResponseEntity<List<FinanceSpentDto>> mySubmissions(Authentication auth) {
        return ResponseEntity.ok(service.getMySubmissions(auth.getName()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','ACCOUNTS','ACCOUNTING') or @pageAccess.hasAccess(authentication, 'FINANCE_SPENT')")
    public ResponseEntity<List<FinanceSpentDto>> pendingApprovals() {
        return ResponseEntity.ok(service.getPendingApprovals());
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','ACCOUNTS','ACCOUNTING') or @pageAccess.hasAccess(authentication, 'FINANCE_SPENT')")
    public ResponseEntity<List<FinanceSpentDto>> reports(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) String project) {
        return ResponseEntity.ok(service.getByDateRange(
                LocalDate.parse(from), LocalDate.parse(to), project));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'FINANCE_SPENT')")
    public ResponseEntity<FinanceSpentDto> approve(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String action = body.get("action");
        String remarks = body.get("remarks");
        return ResponseEntity.ok(service.approve(id, action, remarks, auth.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'FINANCE_SPENT')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Distinct paidBy values for dropdown suggestions */
    @GetMapping("/distinct/paid-by")
    public ResponseEntity<List<String>> distinctPaidBy() {
        return ResponseEntity.ok(service.getDistinctPaidBy());
    }

    /** Distinct paidTo values for dropdown suggestions */
    @GetMapping("/distinct/paid-to")
    public ResponseEntity<List<String>> distinctPaidTo() {
        return ResponseEntity.ok(service.getDistinctPaidTo());
    }

    /** Distinct descriptions for dropdown suggestions */
    @GetMapping("/distinct/descriptions")
    public ResponseEntity<List<String>> distinctDescriptions() {
        return ResponseEntity.ok(service.getDistinctDescriptions());
    }

    /** Active user names for "Who Paid" dropdown */
    @GetMapping("/user-names")
    public ResponseEntity<List<Map<String, Object>>> userNames() {
        return ResponseEntity.ok(service.getUserNames());
    }
}
