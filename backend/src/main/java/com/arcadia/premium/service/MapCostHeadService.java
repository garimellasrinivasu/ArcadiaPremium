package com.arcadia.premium.service;

import com.arcadia.premium.dto.MapCostHeadDto;
import com.arcadia.premium.model.ActivityMaster;
import com.arcadia.premium.model.CostingCustomHead;
import com.arcadia.premium.model.CostingStandardHead;
import com.arcadia.premium.model.Job;
import com.arcadia.premium.model.MapCostHead;
import com.arcadia.premium.repository.ActivityMasterRepository;
import com.arcadia.premium.repository.CostingCustomHeadRepository;
import com.arcadia.premium.repository.CostingStandardHeadRepository;
import com.arcadia.premium.repository.JobRepository;
import com.arcadia.premium.repository.MapCostHeadRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MapCostHeadService {

    private final MapCostHeadRepository repository;
    private final JobRepository jobRepository;
    private final ActivityMasterRepository activityMasterRepository;
    private final CostingStandardHeadRepository standardHeadRepository;
    private final CostingCustomHeadRepository customHeadRepository;

    public MapCostHeadService(MapCostHeadRepository repository,
                               JobRepository jobRepository,
                               ActivityMasterRepository activityMasterRepository,
                               CostingStandardHeadRepository standardHeadRepository,
                               CostingCustomHeadRepository customHeadRepository) {
        this.repository = repository;
        this.jobRepository = jobRepository;
        this.activityMasterRepository = activityMasterRepository;
        this.standardHeadRepository = standardHeadRepository;
        this.customHeadRepository = customHeadRepository;
    }

    public MapCostHeadDto create(Map<String, Object> body, String createdBy) {
        MapCostHead e = new MapCostHead();

        Long jobId = ((Number) body.get("jobId")).longValue();
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));
        e.setJob(job);

        Long activityId = ((Number) body.get("activityId")).longValue();
        ActivityMaster activity = activityMasterRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found with id: " + activityId));
        e.setActivity(activity);

        Long standardHeadId = ((Number) body.get("standardHeadId")).longValue();
        CostingStandardHead sh = standardHeadRepository.findById(standardHeadId)
                .orElseThrow(() -> new RuntimeException("Standard Head not found with id: " + standardHeadId));
        e.setStandardHead(sh);

        if (body.get("customHeadId") != null) {
            Long customHeadId = ((Number) body.get("customHeadId")).longValue();
            CostingCustomHead ch = customHeadRepository.findById(customHeadId)
                    .orElseThrow(() -> new RuntimeException("Custom Head not found with id: " + customHeadId));
            e.setCustomHead(ch);
        }

        if (body.get("active") != null) {
            e.setActive((Boolean) body.get("active"));
        }
        e.setCreatedBy(createdBy);
        return MapCostHeadDto.fromEntity(repository.save(e));
    }

    public List<MapCostHeadDto> getAll() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream().map(MapCostHeadDto::fromEntity).collect(Collectors.toList());
    }

    public List<MapCostHeadDto> getByJob(Long jobId) {
        return repository.findByJobIdOrderByCreatedAtDesc(jobId)
                .stream().map(MapCostHeadDto::fromEntity).collect(Collectors.toList());
    }

    public MapCostHeadDto getById(Long id) {
        MapCostHead e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Map Cost Head not found with id: " + id));
        return MapCostHeadDto.fromEntity(e);
    }

    public MapCostHeadDto update(Long id, Map<String, Object> body) {
        MapCostHead e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Map Cost Head not found with id: " + id));

        if (body.containsKey("jobId")) {
            Long jobId = ((Number) body.get("jobId")).longValue();
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));
            e.setJob(job);
        }

        if (body.containsKey("activityId")) {
            Long activityId = ((Number) body.get("activityId")).longValue();
            ActivityMaster activity = activityMasterRepository.findById(activityId)
                    .orElseThrow(() -> new RuntimeException("Activity not found with id: " + activityId));
            e.setActivity(activity);
        }

        if (body.containsKey("standardHeadId")) {
            Long standardHeadId = ((Number) body.get("standardHeadId")).longValue();
            CostingStandardHead sh = standardHeadRepository.findById(standardHeadId)
                    .orElseThrow(() -> new RuntimeException("Standard Head not found with id: " + standardHeadId));
            e.setStandardHead(sh);
        }

        if (body.containsKey("customHeadId")) {
            if (body.get("customHeadId") != null) {
                Long customHeadId = ((Number) body.get("customHeadId")).longValue();
                CostingCustomHead ch = customHeadRepository.findById(customHeadId)
                        .orElseThrow(() -> new RuntimeException("Custom Head not found with id: " + customHeadId));
                e.setCustomHead(ch);
            } else {
                e.setCustomHead(null);
            }
        }

        if (body.containsKey("active")) e.setActive((Boolean) body.get("active"));
        return MapCostHeadDto.fromEntity(repository.save(e));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public MapCostHeadDto toggleActive(Long id) {
        MapCostHead e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Map Cost Head not found with id: " + id));
        e.setActive(!e.isActive());
        return MapCostHeadDto.fromEntity(repository.save(e));
    }
}
