package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateProjectRequest;
import com.arcadia.premium.dto.ProjectDto;
import com.arcadia.premium.model.Project;
import com.arcadia.premium.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository projectRepo;

    public ProjectService(ProjectRepository projectRepo) {
        this.projectRepo = projectRepo;
    }

    /** Get all active projects (for dropdowns). */
    public List<ProjectDto> getActiveProjects() {
        return projectRepo.findByActiveTrueOrderByNameAsc()
                .stream().map(this::toDto).toList();
    }

    /** Get all projects including inactive (for admin). */
    public List<ProjectDto> getAllProjects() {
        return projectRepo.findAllByOrderByNameAsc()
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public ProjectDto create(CreateProjectRequest req) {
        if (projectRepo.existsByNameIgnoreCase(req.getName().trim())) {
            throw new RuntimeException("A project with name '" + req.getName().trim() + "' already exists.");
        }
        Project p = new Project(req.getName().trim(), req.getDescription());
        p.setActive(req.isActive());
        p = projectRepo.save(p);
        log.info("Created project: {} (id={})", p.getName(), p.getId());
        return toDto(p);
    }

    @Transactional
    public ProjectDto update(Long id, CreateProjectRequest req) {
        Project p = projectRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        // Check for duplicate name (excluding current)
        projectRepo.findByNameIgnoreCase(req.getName().trim())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new RuntimeException("A project with name '" + req.getName().trim() + "' already exists.");
                    }
                });

        p.setName(req.getName().trim());
        p.setDescription(req.getDescription());
        p.setActive(req.isActive());
        p = projectRepo.save(p);
        log.info("Updated project: {} (id={})", p.getName(), p.getId());
        return toDto(p);
    }

    @Transactional
    public void delete(Long id) {
        Project p = projectRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
        projectRepo.delete(p);
        log.info("Deleted project: {} (id={})", p.getName(), p.getId());
    }

    private ProjectDto toDto(Project p) {
        ProjectDto dto = new ProjectDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setDescription(p.getDescription());
        dto.setActive(p.isActive());
        dto.setCreatedAt(p.getCreatedAt());
        return dto;
    }
}
