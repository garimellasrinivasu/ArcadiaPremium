package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateJobRequest;
import com.arcadia.premium.dto.JobDto;
import com.arcadia.premium.model.ActivityMaster;
import com.arcadia.premium.model.Job;
import com.arcadia.premium.model.Project;
import com.arcadia.premium.repository.ActivityMasterRepository;
import com.arcadia.premium.repository.JobRepository;
import com.arcadia.premium.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobRepository repository;
    private final ProjectRepository projectRepository;
    private final ActivityMasterRepository activityMasterRepository;

    public JobService(JobRepository repository,
                      ProjectRepository projectRepository,
                      ActivityMasterRepository activityMasterRepository) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.activityMasterRepository = activityMasterRepository;
    }

    public JobDto create(CreateJobRequest req, String createdBy) {
        Project project = projectRepository.findById(req.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + req.getProjectId()));

        List<ActivityMaster> activities = new ArrayList<>();
        if (req.getActivityIds() != null && !req.getActivityIds().isEmpty()) {
            activities = activityMasterRepository.findAllById(req.getActivityIds());
        }

        Job e = new Job();
        e.setName(req.getName());
        e.setDescription(req.getDescription());
        e.setProject(project);
        e.setUnitName(req.getUnitName());
        e.setActivities(activities);
        e.setCreatedBy(createdBy);
        return JobDto.fromEntity(repository.save(e));
    }

    public List<JobDto> getAll() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream().map(JobDto::fromEntity).collect(Collectors.toList());
    }

    public List<JobDto> getByProject(Long projectId) {
        return repository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(JobDto::fromEntity).collect(Collectors.toList());
    }

    public JobDto getById(Long id) {
        Job e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
        return JobDto.fromEntity(e);
    }

    public JobDto update(Long id, CreateJobRequest req) {
        Job e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));

        Project project = projectRepository.findById(req.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + req.getProjectId()));

        List<ActivityMaster> activities = new ArrayList<>();
        if (req.getActivityIds() != null && !req.getActivityIds().isEmpty()) {
            activities = activityMasterRepository.findAllById(req.getActivityIds());
        }

        e.setName(req.getName());
        e.setDescription(req.getDescription());
        e.setProject(project);
        e.setUnitName(req.getUnitName());
        e.setActivities(activities);
        return JobDto.fromEntity(repository.save(e));
    }

    public JobDto updateStatus(Long id, String status) {
        Job e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
        e.setStatus(status);
        return JobDto.fromEntity(repository.save(e));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
