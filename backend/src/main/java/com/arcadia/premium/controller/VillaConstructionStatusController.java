package com.arcadia.premium.controller;

import com.arcadia.premium.dto.VillaConstructionStatusDto;
import com.arcadia.premium.service.VillaConstructionStatusService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/villa-construction")
public class VillaConstructionStatusController {

    private final VillaConstructionStatusService service;

    public VillaConstructionStatusController(VillaConstructionStatusService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'MASTER_PLAN') or @pageAccess.hasAccess(authentication, 'WORK_EXECUTION')")
    public ResponseEntity<List<VillaConstructionStatusDto>> getAllByProject(
            @RequestParam String projectName) {
        return ResponseEntity.ok(service.getAllByProject(projectName));
    }

    @GetMapping("/phase")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'MASTER_PLAN') or @pageAccess.hasAccess(authentication, 'WORK_EXECUTION')")
    public ResponseEntity<List<VillaConstructionStatusDto>> getByProjectAndPhase(
            @RequestParam String projectName, @RequestParam String phase) {
        return ResponseEntity.ok(service.getByProjectAndPhase(projectName, phase));
    }

    @PostMapping("/toggle")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'MASTER_PLAN') or @pageAccess.hasAccess(authentication, 'WORK_EXECUTION')")
    public ResponseEntity<?> toggleStatus(@RequestBody Map<String, Object> body) {
        try {
            String projectName = (String) body.get("projectName");
            Integer villaNumber = body.get("villaNumber") instanceof Number
                    ? ((Number) body.get("villaNumber")).intValue()
                    : Integer.parseInt((String) body.get("villaNumber"));
            String phase = (String) body.get("phase");
            int activityIndex = body.get("activityIndex") instanceof Number
                    ? ((Number) body.get("activityIndex")).intValue()
                    : Integer.parseInt((String) body.get("activityIndex"));

            VillaConstructionStatusDto result = service.toggleStatus(projectName, villaNumber, phase, activityIndex);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Toggle failed"));
        }
    }

    @PostMapping("/update-details")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'MASTER_PLAN') or @pageAccess.hasAccess(authentication, 'WORK_EXECUTION')")
    public ResponseEntity<?> updateDetails(@RequestBody Map<String, Object> body) {
        try {
            String projectName = (String) body.get("projectName");
            Integer villaNumber = body.get("villaNumber") instanceof Number
                    ? ((Number) body.get("villaNumber")).intValue()
                    : Integer.parseInt((String) body.get("villaNumber"));
            String phase = (String) body.get("phase");
            int activityIndex = body.get("activityIndex") instanceof Number
                    ? ((Number) body.get("activityIndex")).intValue()
                    : Integer.parseInt((String) body.get("activityIndex"));
            boolean done = Boolean.TRUE.equals(body.get("done"));
            String incharge = (String) body.get("incharge");
            String plannedTargetDate = (String) body.get("plannedTargetDate");
            String revisedPlannedDate = (String) body.get("revisedPlannedDate");
            String actualCompletionDate = (String) body.get("actualCompletionDate");

            VillaConstructionStatusDto result = service.updateDetails(
                    projectName, villaNumber, phase, activityIndex,
                    done, incharge, plannedTargetDate, revisedPlannedDate, actualCompletionDate);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Update failed"));
        }
    }

    @PostMapping("/bulk-update")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'MASTER_PLAN') or @pageAccess.hasAccess(authentication, 'WORK_EXECUTION')")
    public ResponseEntity<?> bulkUpdate(@RequestParam String projectName,
                                         @RequestParam String phase,
                                         @RequestBody List<VillaConstructionStatusDto> dtos) {
        try {
            List<VillaConstructionStatusDto> results = service.bulkUpdate(projectName, phase, dtos);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Bulk update failed"));
        }
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'MASTER_PLAN') or @pageAccess.hasAccess(authentication, 'WORK_EXECUTION')")
    public ResponseEntity<Map<String, List<VillaConstructionStatusDto>>> getSummary(
            @RequestParam String projectName) {
        List<VillaConstructionStatusDto> all = service.getAllByProject(projectName);
        Map<String, List<VillaConstructionStatusDto>> grouped = all.stream()
                .collect(Collectors.groupingBy(VillaConstructionStatusDto::getPhase));
        return ResponseEntity.ok(grouped);
    }
}
