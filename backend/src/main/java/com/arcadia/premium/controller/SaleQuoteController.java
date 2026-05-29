package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateSaleQuoteRequest;
import com.arcadia.premium.dto.SaleQuoteDto;
import com.arcadia.premium.service.SaleQuoteService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sale-quotes")
public class SaleQuoteController {

    private final SaleQuoteService service;

    public SaleQuoteController(SaleQuoteService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'SALE_QUOTE')")
    public ResponseEntity<SaleQuoteDto> create(@RequestBody CreateSaleQuoteRequest req, Authentication auth) {
        String createdBy = auth.getName();
        return ResponseEntity.ok(service.create(req, createdBy));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'SALE_QUOTE')")
    public ResponseEntity<List<SaleQuoteDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'SALE_QUOTE')")
    public ResponseEntity<SaleQuoteDto> getById(@PathVariable Long id) {
        SaleQuoteDto dto = service.getById(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'SALE_QUOTE')")
    public ResponseEntity<List<SaleQuoteDto>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getByDateRange(from, to));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER','SALES','SUPERVISOR','OFFICE_ASSISTANT') or @pageAccess.hasAccess(authentication, 'SALE_QUOTE')")
    public ResponseEntity<List<SaleQuoteDto>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.search(q, from, to));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
