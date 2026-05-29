package com.arcadia.premium.service;

import com.arcadia.premium.dto.WarehouseDto;
import com.arcadia.premium.model.Project;
import com.arcadia.premium.model.Warehouse;
import com.arcadia.premium.repository.ProjectRepository;
import com.arcadia.premium.repository.WarehouseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WarehouseService {

    private static final Logger log = LoggerFactory.getLogger(WarehouseService.class);

    private final WarehouseRepository repo;
    private final ProjectRepository projectRepo;

    public WarehouseService(WarehouseRepository repo, ProjectRepository projectRepo) {
        this.repo = repo;
        this.projectRepo = projectRepo;
    }

    public List<WarehouseDto> getAll() {
        return repo.findAllByOrderByNameAsc().stream()
                .map(WarehouseDto::fromEntity).collect(Collectors.toList());
    }

    public List<WarehouseDto> getActive() {
        return repo.findByActiveTrueOrderByNameAsc().stream()
                .map(WarehouseDto::fromEntity).collect(Collectors.toList());
    }

    public List<WarehouseDto> getByProject(Long projectId) {
        return repo.findByProjectIdOrderByNameAsc(projectId).stream()
                .map(WarehouseDto::fromEntity).collect(Collectors.toList());
    }

    public WarehouseDto getById(Long id) {
        return repo.findById(id)
                .map(WarehouseDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Warehouse not found with id: " + id));
    }

    @Transactional
    public WarehouseDto create(WarehouseDto req, String createdBy) {
        Project project = projectRepo.findById(req.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + req.getProjectId()));

        Warehouse w = new Warehouse();
        w.setName(req.getName().trim());
        w.setProject(project);
        w.setLocation(req.getLocation());
        w.setDescription(req.getDescription());
        w.setActive(req.isActive());
        w.setCreatedBy(createdBy);
        w = repo.save(w);
        log.info("Created warehouse: {} (id={})", w.getName(), w.getId());
        return WarehouseDto.fromEntity(w);
    }

    @Transactional
    public WarehouseDto update(Long id, WarehouseDto req) {
        Warehouse w = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found with id: " + id));

        if (req.getProjectId() != null) {
            Project project = projectRepo.findById(req.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + req.getProjectId()));
            w.setProject(project);
        }

        w.setName(req.getName().trim());
        w.setLocation(req.getLocation());
        w.setDescription(req.getDescription());
        w.setActive(req.isActive());
        w = repo.save(w);
        log.info("Updated warehouse: {} (id={})", w.getName(), w.getId());
        return WarehouseDto.fromEntity(w);
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
        log.info("Deleted warehouse id={}", id);
    }
}
