package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CapitolFundConfigDto;
import com.arcadia.premium.service.CapitolFundConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/capitol-fund")
public class CapitolFundConfigController {

    private final CapitolFundConfigService service;

    public CapitolFundConfigController(CapitolFundConfigService service) {
        this.service = service;
    }

    /** Get current config — accessible by ADMIN and PARTNER */
    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARTNER') or @pageAccess.hasAccess(authentication, 'CAPITOL_FUND')")
    public ResponseEntity<CapitolFundConfigDto> getConfig() {
        return ResponseEntity.ok(service.getConfig());
    }

    /** Update SFT price and/or default interest rate — admin only */
    @PutMapping("/config")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'CAPITOL_FUND')")
    public ResponseEntity<?> updateConfig(@RequestBody Map<String, Object> body, Principal principal) {
        try {
            BigDecimal sftPrice = body.containsKey("sftPrice")
                    ? new BigDecimal(body.get("sftPrice").toString()) : null;
            BigDecimal defaultInterestRate = body.containsKey("defaultInterestRate")
                    ? new BigDecimal(body.get("defaultInterestRate").toString()) : null;

            CapitolFundConfigDto updated = service.updateConfig(sftPrice, defaultInterestRate, principal.getName());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
