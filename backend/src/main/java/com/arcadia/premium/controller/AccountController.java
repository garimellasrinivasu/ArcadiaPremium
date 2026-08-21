package com.arcadia.premium.controller;

import com.arcadia.premium.dto.*;
import com.arcadia.premium.service.AccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private static final Logger log = LoggerFactory.getLogger(AccountController.class);
    private final AccountService service;

    public AccountController(AccountService service) {
        this.service = service;
    }

    // ─── Category Endpoints ─────────────────────────────────────────────

    @GetMapping("/categories")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<List<AccountCategoryDto>> listCategories(@RequestParam String projectName) {
        return ResponseEntity.ok(service.listCategories(projectName));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<AccountCategoryDto> createCategory(@RequestBody AccountCategoryDto dto) {
        return ResponseEntity.ok(service.createCategory(dto));
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<AccountCategoryDto> updateCategory(@PathVariable Long id, @RequestBody AccountCategoryDto dto) {
        return ResponseEntity.ok(service.updateCategory(id, dto));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        service.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Entry Endpoints ────────────────────────────────────────────────

    @GetMapping("/entries")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<List<AccountEntryDto>> listEntries(
            @RequestParam String projectName,
            @RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(service.listEntries(projectName, categoryId));
    }

    @PostMapping("/entries")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<AccountEntryDto> createEntry(@RequestBody AccountEntryDto dto) {
        return ResponseEntity.ok(service.createEntry(dto));
    }

    @PutMapping("/entries/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<AccountEntryDto> updateEntry(@PathVariable Long id, @RequestBody AccountEntryDto dto) {
        return ResponseEntity.ok(service.updateEntry(id, dto));
    }

    @DeleteMapping("/entries/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id) {
        service.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Invoice Endpoints ──────────────────────────────────────────────

    @PostMapping("/entries/{entryId}/invoices")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<AccountInvoiceDto> addInvoice(@PathVariable Long entryId, @RequestBody AccountInvoiceDto dto) {
        return ResponseEntity.ok(service.addInvoice(entryId, dto));
    }

    @PutMapping("/invoices/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<AccountInvoiceDto> updateInvoice(@PathVariable Long id, @RequestBody AccountInvoiceDto dto) {
        return ResponseEntity.ok(service.updateInvoice(id, dto));
    }

    @DeleteMapping("/invoices/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        service.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Payment Endpoints ──────────────────────────────────────────────

    @PostMapping("/entries/{entryId}/payments")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<AccountPaymentDto> addPayment(@PathVariable Long entryId, @RequestBody AccountPaymentDto dto) {
        return ResponseEntity.ok(service.addPayment(entryId, dto));
    }

    @PutMapping("/payments/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<AccountPaymentDto> updatePayment(@PathVariable Long id, @RequestBody AccountPaymentDto dto) {
        return ResponseEntity.ok(service.updatePayment(id, dto));
    }

    @DeleteMapping("/payments/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        service.deletePayment(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Ledger ─────────────────────────────────────────────────────────

    @GetMapping("/ledger")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<List<AccountEntryDto>> getLedger(@RequestParam String projectName) {
        return ResponseEntity.ok(service.getLedger(projectName));
    }

    // ─── Summary ────────────────────────────────────────────────────────

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<List<AccountSummaryDto>> getSummary(
            @RequestParam String projectName,
            @RequestParam(defaultValue = "MONTHLY") String period,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getSummary(projectName, period, from, to));
    }

    // ─── Category Totals ────────────────────────────────────────────────

    @GetMapping("/category-totals")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<List<Map<String, Object>>> getCategoryTotals(@RequestParam String projectName) {
        return ResponseEntity.ok(service.getCategoryTotals(projectName));
    }

    // ─── Vendor Totals ──────────────────────────────────────────────────

    @GetMapping("/vendor-totals")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<List<Map<String, Object>>> getVendorTotals(
            @RequestParam String projectName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getVendorTotals(projectName, from, to));
    }

    // ─── Excel Import ───────────────────────────────────────────────────

    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<Map<String, Object>> importExcel(
            @RequestParam String projectName,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(service.importFromExcel(projectName, file));
    }

    // ─── Excel Export ───────────────────────────────────────────────────

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'ACCOUNTS')")
    public ResponseEntity<byte[]> exportExcel(@RequestParam String projectName) {
        byte[] data = service.exportToExcel(projectName);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=accounts_ledger_" + projectName + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }
}
