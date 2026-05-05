package com.arcadia.premium.service;

import com.arcadia.premium.dto.CapitolFundConfigDto;
import com.arcadia.premium.model.CapitolFundConfig;
import com.arcadia.premium.repository.CapitolFundConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class CapitolFundConfigService {

    private final CapitolFundConfigRepository repository;

    public CapitolFundConfigService(CapitolFundConfigRepository repository) {
        this.repository = repository;
    }

    /**
     * Get the current config. If none exists, create a default one.
     * There is always exactly one config row.
     */
    public CapitolFundConfigDto getConfig() {
        CapitolFundConfig config = repository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    CapitolFundConfig defaults = new CapitolFundConfig();
                    defaults.setSftPrice(new BigDecimal("7000.00"));
                    defaults.setDefaultInterestRate(new BigDecimal("1.50"));
                    defaults.setUpdatedBy("SYSTEM");
                    return repository.save(defaults);
                });
        return CapitolFundConfigDto.fromEntity(config);
    }

    /**
     * Update the config (SFT price and/or default interest rate).
     */
    @Transactional
    public CapitolFundConfigDto updateConfig(BigDecimal sftPrice, BigDecimal defaultInterestRate, String updatedBy) {
        CapitolFundConfig config = repository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    CapitolFundConfig defaults = new CapitolFundConfig();
                    return repository.save(defaults);
                });

        if (sftPrice != null && sftPrice.compareTo(BigDecimal.ZERO) > 0) {
            config.setSftPrice(sftPrice);
        }
        if (defaultInterestRate != null && defaultInterestRate.compareTo(BigDecimal.ZERO) > 0) {
            config.setDefaultInterestRate(defaultInterestRate);
        }
        config.setUpdatedBy(updatedBy);

        return CapitolFundConfigDto.fromEntity(repository.save(config));
    }
}
