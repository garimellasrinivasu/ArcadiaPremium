package com.arcadia.premium.controller;

import com.arcadia.premium.dto.EstimationRowDTO;
import com.arcadia.premium.dto.EstimationTabDTO;
import com.arcadia.premium.service.EstimationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/estimation")
public class EstimationController {

    private final EstimationService service;

    public EstimationController(EstimationService service) {
        this.service = service;
    }

    // ───── TAB ENDPOINTS ─────

    @GetMapping("/tabs/project/{projectId}")
    public List<EstimationTabDTO> getTabsByProject(@PathVariable Long projectId) {
        return service.getTabsByProject(projectId);
    }

    @GetMapping("/tabs/{tabId}")
    public EstimationTabDTO getTab(@PathVariable Long tabId) {
        return service.getTab(tabId);
    }

    @PostMapping("/tabs")
    public EstimationTabDTO createTab(@RequestBody EstimationTabDTO dto) {
        return service.createTab(dto);
    }

    @PutMapping("/tabs/{tabId}")
    public EstimationTabDTO updateTab(@PathVariable Long tabId, @RequestBody EstimationTabDTO dto) {
        return service.updateTab(tabId, dto);
    }

    @DeleteMapping("/tabs/{tabId}")
    public ResponseEntity<Void> deleteTab(@PathVariable Long tabId) {
        service.deleteTab(tabId);
        return ResponseEntity.noContent().build();
    }

    // ───── ROW ENDPOINTS ─────

    @PostMapping("/rows")
    public EstimationRowDTO createRow(@RequestBody EstimationRowDTO dto) {
        return service.createRow(dto);
    }

    @PutMapping("/rows/{rowId}")
    public EstimationRowDTO updateRow(@PathVariable Long rowId, @RequestBody EstimationRowDTO dto) {
        return service.updateRow(rowId, dto);
    }

    @DeleteMapping("/rows/{rowId}")
    public ResponseEntity<Void> deleteRow(@PathVariable Long rowId) {
        service.deleteRow(rowId);
        return ResponseEntity.noContent().build();
    }

    /** Bulk save all rows for a tab (replaces existing) */
    @PutMapping("/tabs/{tabId}/rows")
    public EstimationTabDTO bulkSaveRows(@PathVariable Long tabId, @RequestBody List<EstimationRowDTO> rows) {
        return service.bulkSaveRows(tabId, rows);
    }
}
