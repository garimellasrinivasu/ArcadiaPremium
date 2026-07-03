package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateFinanceSpentRequest;
import com.arcadia.premium.dto.FinanceSpentDto;
import com.arcadia.premium.service.FinanceSpentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance-spent")
public class FinanceSpentController {

    private static final Logger log = LoggerFactory.getLogger(FinanceSpentController.class);

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

    /** Lightweight endpoint — returns ONLY the receipt image as JSON (legacy) */
    @GetMapping("/{id}/receipt")
    public ResponseEntity<Map<String, String>> getReceipt(@PathVariable Long id) {
        String image = service.getReceiptImage(id);
        return ResponseEntity.ok(Map.of("receiptImageBase64", image));
    }

    /**
     * Returns the receipt as a raw binary image with proper Content-Type.
     * Much more efficient than JSON-wrapping the base64 — avoids serialization
     * overhead and allows the browser to stream the image directly.
     */
    @GetMapping("/{id}/receipt-image")
    public ResponseEntity<byte[]> getReceiptImageBinary(@PathVariable Long id) {
        try {
            String dataUrl = service.getReceiptImage(id);
            if (dataUrl == null || dataUrl.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            // Parse data URL: data:image/jpeg;base64,/9j/4AAQ...
            if (dataUrl.startsWith("data:")) {
                int semicolonIdx = dataUrl.indexOf(';');
                int commaIdx = dataUrl.indexOf(',');
                if (semicolonIdx < 0 || commaIdx < 0) {
                    log.error("Malformed data URL for finance entry {}: no semicolon or comma found", id);
                    return ResponseEntity.internalServerError().build();
                }
                String mimeType = dataUrl.substring(5, semicolonIdx); // e.g. "image/jpeg"
                String rawBase64 = dataUrl.substring(commaIdx + 1);
                byte[] imageBytes = Base64.getDecoder().decode(rawBase64);
                log.debug("Serving receipt image for entry {}: {} bytes, type {}", id, imageBytes.length, mimeType);
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(mimeType))
                        .header("Content-Disposition", "inline")
                        .header("Cache-Control", "private, max-age=3600")
                        .body(imageBytes);
            }
            // Fallback: assume raw base64 JPEG (no data: prefix)
            byte[] imageBytes = Base64.getDecoder().decode(dataUrl);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .header("Content-Disposition", "inline")
                    .body(imageBytes);
        } catch (Exception e) {
            log.error("Failed to serve receipt image for entry {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
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

    /** STAGE 2: Authority approves or rejects a payment request */
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

    /** Get approved requests ready for the current user to pay */
    @GetMapping("/approved-for-payment")
    public ResponseEntity<List<FinanceSpentDto>> approvedForPayment(Authentication auth) {
        return ResponseEntity.ok(service.getApprovedForPayment(auth.getName()));
    }

    /** STAGE 3: User marks an approved request as paid with receipt */
    @PutMapping("/{id}/mark-paid")
    public ResponseEntity<FinanceSpentDto> markPaid(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        return ResponseEntity.ok(service.markPaid(
                id,
                body.get("receiptImageBase64"),
                body.get("paymentDate"),
                body.get("paymentRemarks"),
                body.get("vendorAcknowledgement"),
                auth.getName()));
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
