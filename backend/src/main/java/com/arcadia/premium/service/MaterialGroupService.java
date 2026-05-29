package com.arcadia.premium.service;

import com.arcadia.premium.dto.MaterialGroupDto;
import com.arcadia.premium.model.MaterialGroup;
import com.arcadia.premium.repository.MaterialGroupRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialGroupService {

    private static final Logger log = LoggerFactory.getLogger(MaterialGroupService.class);

    private final MaterialGroupRepository repo;

    public MaterialGroupService(MaterialGroupRepository repo) {
        this.repo = repo;
    }

    public List<MaterialGroupDto> getAll() {
        return repo.findAllByOrderByNameAsc().stream()
                .map(MaterialGroupDto::fromEntity).collect(Collectors.toList());
    }

    public List<MaterialGroupDto> getActive() {
        return repo.findByActiveTrueOrderByNameAsc().stream()
                .map(MaterialGroupDto::fromEntity).collect(Collectors.toList());
    }

    public MaterialGroupDto getById(Long id) {
        return repo.findById(id)
                .map(MaterialGroupDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("MaterialGroup not found with id: " + id));
    }

    @Transactional
    public MaterialGroupDto create(MaterialGroupDto req) {
        MaterialGroup g = new MaterialGroup();
        g.setName(req.getName().trim());
        g.setDescription(req.getDescription());
        g.setActive(req.isActive());
        g = repo.save(g);
        log.info("Created material group: {} (id={})", g.getName(), g.getId());
        return MaterialGroupDto.fromEntity(g);
    }

    @Transactional
    public MaterialGroupDto update(Long id, MaterialGroupDto req) {
        MaterialGroup g = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MaterialGroup not found with id: " + id));
        g.setName(req.getName().trim());
        g.setDescription(req.getDescription());
        g.setActive(req.isActive());
        g = repo.save(g);
        log.info("Updated material group: {} (id={})", g.getName(), g.getId());
        return MaterialGroupDto.fromEntity(g);
    }

    @Transactional
    public MaterialGroupDto toggleActive(Long id) {
        MaterialGroup g = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MaterialGroup not found with id: " + id));
        g.setActive(!g.isActive());
        g = repo.save(g);
        log.info("Toggled material group active={}: {} (id={})", g.isActive(), g.getName(), g.getId());
        return MaterialGroupDto.fromEntity(g);
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
        log.info("Deleted material group id={}", id);
    }
}
