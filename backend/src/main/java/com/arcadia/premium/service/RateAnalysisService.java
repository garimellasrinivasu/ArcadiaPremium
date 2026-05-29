package com.arcadia.premium.service;

import com.arcadia.premium.dto.RateAnalysisDto;
import com.arcadia.premium.model.ActivityMaster;
import com.arcadia.premium.model.Project;
import com.arcadia.premium.model.RateAnalysis;
import com.arcadia.premium.model.RateAnalysisItem;
import com.arcadia.premium.repository.ActivityMasterRepository;
import com.arcadia.premium.repository.ProjectRepository;
import com.arcadia.premium.repository.RateAnalysisRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RateAnalysisService {

    private final RateAnalysisRepository repo;
    private final ProjectRepository projectRepo;
    private final ActivityMasterRepository activityRepo;

    public RateAnalysisService(RateAnalysisRepository repo,
                               ProjectRepository projectRepo,
                               ActivityMasterRepository activityRepo) {
        this.repo = repo;
        this.projectRepo = projectRepo;
        this.activityRepo = activityRepo;
    }

    @Transactional
    public RateAnalysisDto create(Map<String, Object> req, String createdBy) {
        Long projectId = toLong(req.get("projectId"));
        Long activityId = toLong(req.get("activityId"));

        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
        ActivityMaster activity = activityRepo.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found: " + activityId));

        RateAnalysis ra = new RateAnalysis();
        ra.setProject(project);
        ra.setActivity(activity);
        ra.setRateType((String) req.getOrDefault("rateType", "RATE_ANALYSIS"));
        ra.setRemarks((String) req.get("remarks"));
        ra.setCreatedBy(createdBy);
        ra.setStatus("DRAFT");

        // Parse items
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemMaps = (List<Map<String, Object>>) req.get("items");
        BigDecimal totalUnitRate = BigDecimal.ZERO;

        if (itemMaps != null) {
            int order = 0;
            for (Map<String, Object> im : itemMaps) {
                RateAnalysisItem item = new RateAnalysisItem();
                item.setRateAnalysis(ra);
                item.setCategory((String) im.get("category"));
                item.setDescription((String) im.get("description"));
                item.setUom((String) im.get("uom"));
                item.setCoefficient(toBigDecimal(im.get("coefficient")));
                item.setRate(toBigDecimal(im.get("rate")));

                BigDecimal amount = item.getCoefficient()
                        .multiply(item.getRate())
                        .setScale(2, RoundingMode.HALF_UP);
                item.setAmount(amount);

                item.setSortOrder(im.get("sortOrder") != null ? toInt(im.get("sortOrder")) : order);
                ra.getItems().add(item);
                totalUnitRate = totalUnitRate.add(amount);
                order++;
            }
        }

        ra.setUnitRate(totalUnitRate);
        return RateAnalysisDto.fromEntity(repo.save(ra));
    }

    public List<RateAnalysisDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(RateAnalysisDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<RateAnalysisDto> getByProject(Long projectId) {
        return repo.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(RateAnalysisDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<RateAnalysisDto> getByActivity(Long activityId) {
        return repo.findByActivityIdOrderByCreatedAtDesc(activityId).stream()
                .map(RateAnalysisDto::fromEntity)
                .collect(Collectors.toList());
    }

    public RateAnalysisDto getById(Long id) {
        return repo.findById(id)
                .map(RateAnalysisDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Rate analysis not found: " + id));
    }

    @Transactional
    public RateAnalysisDto updateStatus(Long id, String status) {
        RateAnalysis ra = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Rate analysis not found: " + id));
        ra.setStatus(status);
        return RateAnalysisDto.fromEntity(repo.save(ra));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    // ── Helpers ──

    private Long toLong(Object val) {
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).longValue();
        return Long.parseLong(val.toString());
    }

    private int toInt(Object val) {
        if (val instanceof Number) return ((Number) val).intValue();
        return Integer.parseInt(val.toString());
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof BigDecimal) return (BigDecimal) val;
        if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
        return new BigDecimal(val.toString());
    }
}
