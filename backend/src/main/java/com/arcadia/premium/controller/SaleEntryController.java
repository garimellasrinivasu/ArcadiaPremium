package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateSaleEntryRequest;
import com.arcadia.premium.dto.SaleEntryDto;
import com.arcadia.premium.dto.UpdatePaymentRequest;
import com.arcadia.premium.service.SaleEntryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
public class SaleEntryController {

    private final SaleEntryService saleEntryService;

    public SaleEntryController(SaleEntryService saleEntryService) {
        this.saleEntryService = saleEntryService;
    }

    @GetMapping
    public ResponseEntity<List<SaleEntryDto>> getAllSaleEntries() {
        return ResponseEntity.ok(saleEntryService.getAllSaleEntries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleEntryDto> getSaleEntryById(@PathVariable Long id) {
        return ResponseEntity.ok(saleEntryService.getSaleEntryById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<SaleEntryDto>> searchByCustomerName(@RequestParam String name) {
        return ResponseEntity.ok(saleEntryService.searchByCustomerName(name));
    }

    @PostMapping
    public ResponseEntity<SaleEntryDto> createSaleEntry(@Valid @RequestBody CreateSaleEntryRequest request) {
        return ResponseEntity.ok(saleEntryService.createSaleEntry(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SaleEntryDto> updateSaleEntry(@PathVariable Long id,
                                                         @Valid @RequestBody CreateSaleEntryRequest request) {
        return ResponseEntity.ok(saleEntryService.updateSaleEntry(id, request));
    }

    @PutMapping("/{id}/payment")
    public ResponseEntity<SaleEntryDto> updatePayment(@PathVariable Long id,
                                                       @Valid @RequestBody UpdatePaymentRequest request) {
        return ResponseEntity.ok(saleEntryService.updatePayment(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSaleEntry(@PathVariable Long id) {
        saleEntryService.deleteSaleEntry(id);
        return ResponseEntity.ok(Map.of("message", "Sale entry deleted successfully"));
    }
}
