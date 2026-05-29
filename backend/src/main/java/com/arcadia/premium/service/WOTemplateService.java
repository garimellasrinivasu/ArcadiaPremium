package com.arcadia.premium.service;

import com.arcadia.premium.dto.WOTemplateDto;
import com.arcadia.premium.model.WOTemplate;
import com.arcadia.premium.repository.WOTemplateRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WOTemplateService {

    private final WOTemplateRepository repository;

    public WOTemplateService(WOTemplateRepository repository) {
        this.repository = repository;
    }

    public WOTemplateDto create(Map<String, Object> body, String createdBy) {
        WOTemplate e = new WOTemplate();
        e.setCode(generateCode());
        e.setName((String) body.get("name"));
        e.setDescription((String) body.get("description"));
        e.setDefaultContractType((String) body.get("defaultContractType"));
        e.setDefaultTermsAndConditions((String) body.get("defaultTermsAndConditions"));
        e.setDefaultAdvanceType((String) body.get("defaultAdvanceType"));
        if (body.get("defaultAdvanceValue") != null) {
            e.setDefaultAdvanceValue(new BigDecimal(body.get("defaultAdvanceValue").toString()));
        }
        e.setDefaultRetentionType((String) body.get("defaultRetentionType"));
        if (body.get("defaultRetentionValue") != null) {
            e.setDefaultRetentionValue(new BigDecimal(body.get("defaultRetentionValue").toString()));
        }
        if (body.get("active") != null) {
            e.setActive((Boolean) body.get("active"));
        }
        e.setCreatedBy(createdBy);
        return WOTemplateDto.fromEntity(repository.save(e));
    }

    public List<WOTemplateDto> getAll() {
        return repository.findAllByOrderByNameAsc()
                .stream().map(WOTemplateDto::fromEntity).collect(Collectors.toList());
    }

    public List<WOTemplateDto> getActive() {
        return repository.findByActiveTrueOrderByNameAsc()
                .stream().map(WOTemplateDto::fromEntity).collect(Collectors.toList());
    }

    public WOTemplateDto getById(Long id) {
        WOTemplate e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("WO Template not found with id: " + id));
        return WOTemplateDto.fromEntity(e);
    }

    public WOTemplateDto update(Long id, Map<String, Object> body) {
        WOTemplate e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("WO Template not found with id: " + id));
        if (body.containsKey("name")) e.setName((String) body.get("name"));
        if (body.containsKey("description")) e.setDescription((String) body.get("description"));
        if (body.containsKey("defaultContractType")) e.setDefaultContractType((String) body.get("defaultContractType"));
        if (body.containsKey("defaultTermsAndConditions")) e.setDefaultTermsAndConditions((String) body.get("defaultTermsAndConditions"));
        if (body.containsKey("defaultAdvanceType")) e.setDefaultAdvanceType((String) body.get("defaultAdvanceType"));
        if (body.containsKey("defaultAdvanceValue")) {
            e.setDefaultAdvanceValue(body.get("defaultAdvanceValue") != null
                    ? new BigDecimal(body.get("defaultAdvanceValue").toString()) : null);
        }
        if (body.containsKey("defaultRetentionType")) e.setDefaultRetentionType((String) body.get("defaultRetentionType"));
        if (body.containsKey("defaultRetentionValue")) {
            e.setDefaultRetentionValue(body.get("defaultRetentionValue") != null
                    ? new BigDecimal(body.get("defaultRetentionValue").toString()) : null);
        }
        if (body.containsKey("active")) e.setActive((Boolean) body.get("active"));
        return WOTemplateDto.fromEntity(repository.save(e));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public WOTemplateDto toggleActive(Long id) {
        WOTemplate e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("WO Template not found with id: " + id));
        e.setActive(!e.isActive());
        return WOTemplateDto.fromEntity(repository.save(e));
    }

    public String generateCode() {
        String maxCode = repository.findMaxCode().orElse(null);
        int nextNum = 1;
        if (maxCode != null && maxCode.startsWith("WOT-")) {
            try {
                nextNum = Integer.parseInt(maxCode.substring(4)) + 1;
            } catch (NumberFormatException ignored) {
                // fallback to 1
            }
        }
        return String.format("WOT-%03d", nextNum);
    }
}
