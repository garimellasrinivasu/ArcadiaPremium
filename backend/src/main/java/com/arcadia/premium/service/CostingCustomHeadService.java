package com.arcadia.premium.service;

import com.arcadia.premium.dto.CostingCustomHeadDto;
import com.arcadia.premium.model.CostingCustomHead;
import com.arcadia.premium.model.CostingStandardHead;
import com.arcadia.premium.model.Project;
import com.arcadia.premium.repository.CostingCustomHeadRepository;
import com.arcadia.premium.repository.CostingStandardHeadRepository;
import com.arcadia.premium.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CostingCustomHeadService {

    private final CostingCustomHeadRepository repository;
    private final CostingStandardHeadRepository standardHeadRepository;
    private final ProjectRepository projectRepository;

    public CostingCustomHeadService(CostingCustomHeadRepository repository,
                                     CostingStandardHeadRepository standardHeadRepository,
                                     ProjectRepository projectRepository) {
        this.repository = repository;
        this.standardHeadRepository = standardHeadRepository;
        this.projectRepository = projectRepository;
    }

    public CostingCustomHeadDto create(Map<String, Object> body, String createdBy) {
        CostingCustomHead e = new CostingCustomHead();
        e.setCode(generateCode());
        e.setName((String) body.get("name"));
        e.setDescription((String) body.get("description"));

        if (body.get("standardHeadId") != null) {
            Long standardHeadId = ((Number) body.get("standardHeadId")).longValue();
            CostingStandardHead sh = standardHeadRepository.findById(standardHeadId)
                    .orElseThrow(() -> new RuntimeException("Standard Head not found with id: " + standardHeadId));
            e.setStandardHead(sh);
        }

        if (body.get("projectId") != null) {
            Long projectId = ((Number) body.get("projectId")).longValue();
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));
            e.setProject(project);
        }

        if (body.get("active") != null) {
            e.setActive((Boolean) body.get("active"));
        }
        e.setCreatedBy(createdBy);
        return CostingCustomHeadDto.fromEntity(repository.save(e));
    }

    public List<CostingCustomHeadDto> getAll() {
        return repository.findAllByOrderByNameAsc()
                .stream().map(CostingCustomHeadDto::fromEntity).collect(Collectors.toList());
    }

    public List<CostingCustomHeadDto> getByProject(Long projectId) {
        return repository.findByProjectIdOrderByNameAsc(projectId)
                .stream().map(CostingCustomHeadDto::fromEntity).collect(Collectors.toList());
    }

    public List<CostingCustomHeadDto> getActive() {
        return repository.findByActiveTrueOrderByNameAsc()
                .stream().map(CostingCustomHeadDto::fromEntity).collect(Collectors.toList());
    }

    public CostingCustomHeadDto getById(Long id) {
        CostingCustomHead e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Costing Custom Head not found with id: " + id));
        return CostingCustomHeadDto.fromEntity(e);
    }

    public CostingCustomHeadDto update(Long id, Map<String, Object> body) {
        CostingCustomHead e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Costing Custom Head not found with id: " + id));
        if (body.containsKey("name")) e.setName((String) body.get("name"));
        if (body.containsKey("description")) e.setDescription((String) body.get("description"));

        if (body.containsKey("standardHeadId")) {
            if (body.get("standardHeadId") != null) {
                Long standardHeadId = ((Number) body.get("standardHeadId")).longValue();
                CostingStandardHead sh = standardHeadRepository.findById(standardHeadId)
                        .orElseThrow(() -> new RuntimeException("Standard Head not found with id: " + standardHeadId));
                e.setStandardHead(sh);
            } else {
                e.setStandardHead(null);
            }
        }

        if (body.containsKey("projectId")) {
            if (body.get("projectId") != null) {
                Long projectId = ((Number) body.get("projectId")).longValue();
                Project project = projectRepository.findById(projectId)
                        .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));
                e.setProject(project);
            } else {
                e.setProject(null);
            }
        }

        if (body.containsKey("active")) e.setActive((Boolean) body.get("active"));
        return CostingCustomHeadDto.fromEntity(repository.save(e));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public CostingCustomHeadDto toggleActive(Long id) {
        CostingCustomHead e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Costing Custom Head not found with id: " + id));
        e.setActive(!e.isActive());
        return CostingCustomHeadDto.fromEntity(repository.save(e));
    }

    public String generateCode() {
        String maxCode = repository.findMaxCode().orElse(null);
        int nextNum = 1;
        if (maxCode != null && maxCode.startsWith("CCH-")) {
            try {
                nextNum = Integer.parseInt(maxCode.substring(4)) + 1;
            } catch (NumberFormatException ignored) {
                // fallback to 1
            }
        }
        return String.format("CCH-%03d", nextNum);
    }
}
