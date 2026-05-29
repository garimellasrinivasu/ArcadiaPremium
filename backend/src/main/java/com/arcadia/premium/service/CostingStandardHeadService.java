package com.arcadia.premium.service;

import com.arcadia.premium.dto.CostingStandardHeadDto;
import com.arcadia.premium.model.CostingStandardHead;
import com.arcadia.premium.repository.CostingStandardHeadRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CostingStandardHeadService {

    private final CostingStandardHeadRepository repository;

    public CostingStandardHeadService(CostingStandardHeadRepository repository) {
        this.repository = repository;
    }

    public CostingStandardHeadDto create(Map<String, Object> body, String createdBy) {
        CostingStandardHead e = new CostingStandardHead();
        e.setCode(generateCode());
        e.setName((String) body.get("name"));
        e.setDescription((String) body.get("description"));
        e.setCategory((String) body.get("category"));
        if (body.get("active") != null) {
            e.setActive((Boolean) body.get("active"));
        }
        e.setCreatedBy(createdBy);
        return CostingStandardHeadDto.fromEntity(repository.save(e));
    }

    public List<CostingStandardHeadDto> getAll() {
        return repository.findAllByOrderByNameAsc()
                .stream().map(CostingStandardHeadDto::fromEntity).collect(Collectors.toList());
    }

    public List<CostingStandardHeadDto> getActive() {
        return repository.findByActiveTrueOrderByNameAsc()
                .stream().map(CostingStandardHeadDto::fromEntity).collect(Collectors.toList());
    }

    public List<CostingStandardHeadDto> getByCategory(String category) {
        return repository.findByCategoryOrderByNameAsc(category)
                .stream().map(CostingStandardHeadDto::fromEntity).collect(Collectors.toList());
    }

    public CostingStandardHeadDto getById(Long id) {
        CostingStandardHead e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Costing Standard Head not found with id: " + id));
        return CostingStandardHeadDto.fromEntity(e);
    }

    public CostingStandardHeadDto update(Long id, Map<String, Object> body) {
        CostingStandardHead e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Costing Standard Head not found with id: " + id));
        if (body.containsKey("name")) e.setName((String) body.get("name"));
        if (body.containsKey("description")) e.setDescription((String) body.get("description"));
        if (body.containsKey("category")) e.setCategory((String) body.get("category"));
        if (body.containsKey("active")) e.setActive((Boolean) body.get("active"));
        return CostingStandardHeadDto.fromEntity(repository.save(e));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public CostingStandardHeadDto toggleActive(Long id) {
        CostingStandardHead e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Costing Standard Head not found with id: " + id));
        e.setActive(!e.isActive());
        return CostingStandardHeadDto.fromEntity(repository.save(e));
    }

    public String generateCode() {
        String maxCode = repository.findMaxCode().orElse(null);
        int nextNum = 1;
        if (maxCode != null && maxCode.startsWith("CSH-")) {
            try {
                nextNum = Integer.parseInt(maxCode.substring(4)) + 1;
            } catch (NumberFormatException ignored) {
                // fallback to 1
            }
        }
        return String.format("CSH-%03d", nextNum);
    }
}
