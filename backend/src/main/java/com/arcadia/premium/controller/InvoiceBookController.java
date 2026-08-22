package com.arcadia.premium.controller;

import com.arcadia.premium.dto.InvoiceBookEntryDto;
import com.arcadia.premium.service.InvoiceBookService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoice-book")
public class InvoiceBookController {

    private final InvoiceBookService service;

    public InvoiceBookController(InvoiceBookService service) {
        this.service = service;
    }

    /**
     * List all invoice entries for a project (without image data for performance).
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'INVOICE_ENTRY')")
    public ResponseEntity<List<InvoiceBookEntryDto>> list(@RequestParam String projectName) {
        return ResponseEntity.ok(service.list(projectName));
    }

    /**
     * Get a single invoice entry by ID (includes image data).
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'INVOICE_ENTRY')")
    public ResponseEntity<InvoiceBookEntryDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    /**
     * Create a new invoice entry.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'INVOICE_ENTRY')")
    public ResponseEntity<InvoiceBookEntryDto> create(@RequestBody InvoiceBookEntryDto dto,
                                                       Authentication auth) {
        dto.setCreatedBy(auth.getName());
        return ResponseEntity.ok(service.create(dto));
    }

    /**
     * Update an existing invoice entry.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'INVOICE_ENTRY')")
    public ResponseEntity<InvoiceBookEntryDto> update(@PathVariable Long id,
                                                       @RequestBody InvoiceBookEntryDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    /**
     * Delete an invoice entry.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'INVOICE_ENTRY')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Extract data from an invoice image using OCR.
     * Receives { "imageBase64": "..." } and returns best-effort extracted fields.
     * Always returns 200 — extraction failures return an empty DTO (user fills manually).
     */
    @PostMapping("/extract-image")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'INVOICE_ENTRY')")
    public ResponseEntity<InvoiceBookEntryDto> extractImage(@RequestBody Map<String, String> body) {
        String imageBase64 = body.get("imageBase64");
        if (imageBase64 == null || imageBase64.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(service.extractFromImage(imageBase64));
        } catch (Throwable e) {
            // Never return 500 from this endpoint — if OCR fails, return empty DTO
            InvoiceBookEntryDto fallback = new InvoiceBookEntryDto();
            fallback.setEntryMode("IMAGE");
            fallback.setInvoiceImageBase64(imageBase64);
            return ResponseEntity.ok(fallback);
        }
    }

    /**
     * Export invoice entries for a project as an Excel download.
     */
    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'INVOICE_ENTRY')")
    public ResponseEntity<byte[]> exportExcel(@RequestParam String projectName) throws IOException {
        byte[] excelBytes = service.exportToExcel(projectName);
        String filename = "InvoiceEntries_" + projectName.replaceAll("\\s+", "_") + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }
}
