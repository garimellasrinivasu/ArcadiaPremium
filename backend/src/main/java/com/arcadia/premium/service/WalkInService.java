package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateWalkInRequest;
import com.arcadia.premium.dto.WalkInDto;
import com.arcadia.premium.model.WalkIn;
import com.arcadia.premium.repository.WalkInRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WalkInService {

    private final WalkInRepository repo;

    public WalkInService(WalkInRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public WalkInDto create(CreateWalkInRequest req, String createdBy) {
        WalkIn w = new WalkIn();
        w.setVisitDate(req.getVisitDate());
        w.setVisitorName(req.getVisitorName());
        w.setPhone(req.getPhone());
        w.setEmail(req.getEmail());
        w.setSource(req.getSource());
        w.setSourceDetails(req.getSourceDetails());
        w.setProjectName(req.getProjectName());
        w.setPlotSizeInterested(req.getPlotSizeInterested());
        w.setBudgetRange(req.getBudgetRange());
        w.setFacingPreference(req.getFacingPreference());
        w.setCustomerProfile(req.getCustomerProfile());
        w.setPaymentMode(req.getPaymentMode());
        w.setProspect(req.isProspect());
        w.setStatus(req.getStatus() != null && !req.getStatus().isBlank() ? req.getStatus() : "WARM");
        w.setNextFollowUpDate(req.getNextFollowUpDate());
        w.setRemarks(req.getRemarks());
        w.setFollowUp1(req.getFollowUp1());
        w.setFollowUp2(req.getFollowUp2());
        w.setFollowUp3(req.getFollowUp3());
        w.setHandledBy(req.getHandledBy());
        w.setCreatedBy(createdBy);

        return WalkInDto.fromEntity(repo.save(w));
    }

    @Transactional
    public WalkInDto update(Long id, CreateWalkInRequest req) {
        WalkIn w = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Walk-in not found: " + id));

        w.setVisitDate(req.getVisitDate());
        w.setVisitorName(req.getVisitorName());
        w.setPhone(req.getPhone());
        w.setEmail(req.getEmail());
        w.setSource(req.getSource());
        w.setSourceDetails(req.getSourceDetails());
        w.setProjectName(req.getProjectName());
        w.setPlotSizeInterested(req.getPlotSizeInterested());
        w.setBudgetRange(req.getBudgetRange());
        w.setFacingPreference(req.getFacingPreference());
        w.setCustomerProfile(req.getCustomerProfile());
        w.setPaymentMode(req.getPaymentMode());
        w.setProspect(req.isProspect());
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            w.setStatus(req.getStatus());
        }
        w.setNextFollowUpDate(req.getNextFollowUpDate());
        w.setRemarks(req.getRemarks());
        w.setFollowUp1(req.getFollowUp1());
        w.setFollowUp2(req.getFollowUp2());
        w.setFollowUp3(req.getFollowUp3());
        w.setHandledBy(req.getHandledBy());

        return WalkInDto.fromEntity(repo.save(w));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    public List<WalkInDto> getAll() {
        return repo.findAllByOrderByVisitDateDesc().stream()
                .map(WalkInDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<WalkInDto> getByProject(String projectName) {
        return repo.findByProjectNameOrderByVisitDateDesc(projectName).stream()
                .map(WalkInDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<WalkInDto> getByDateRange(LocalDate from, LocalDate to) {
        return repo.findByVisitDateBetweenOrderByVisitDateDesc(from, to).stream()
                .map(WalkInDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<WalkInDto> getByStatus(String status) {
        return repo.findByStatusOrderByVisitDateDesc(status).stream()
                .map(WalkInDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<WalkInDto> getPendingFollowUps() {
        LocalDate today = LocalDate.now();
        // From a very early date up to today — captures overdue and today's follow-ups
        return repo.findByNextFollowUpDateBetweenOrderByNextFollowUpDateAsc(LocalDate.of(2000, 1, 1), today).stream()
                .map(WalkInDto::fromEntity)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getDashboardStats(String projectName, LocalDate from, LocalDate to) {
        List<WalkIn> all;
        if (projectName != null && !projectName.isBlank()) {
            all = repo.findByProjectNameAndVisitDateBetweenOrderByVisitDateDesc(projectName, from, to);
        } else {
            all = repo.findByVisitDateBetweenOrderByVisitDateDesc(from, to);
        }

        Map<String, Object> stats = new LinkedHashMap<>();

        // Total walk-ins
        stats.put("totalWalkIns", (long) all.size());

        // Count by source
        Map<String, Long> bySource = all.stream()
                .collect(Collectors.groupingBy(WalkIn::getSource, Collectors.counting()));
        stats.put("bySource", bySource);

        // Count by status
        Map<String, Long> byStatus = all.stream()
                .collect(Collectors.groupingBy(WalkIn::getStatus, Collectors.counting()));
        stats.put("byStatus", byStatus);

        // Count by handler
        Map<String, Long> byHandler = all.stream()
                .collect(Collectors.groupingBy(WalkIn::getHandledBy, Collectors.counting()));
        stats.put("byHandler", byHandler);

        // Daily counts
        Map<LocalDate, Long> dailyCounts = all.stream()
                .collect(Collectors.groupingBy(WalkIn::getVisitDate, Collectors.counting()));
        List<Map<String, Object>> byDate = dailyCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("date", entry.getKey());
                    m.put("count", entry.getValue());
                    return m;
                })
                .collect(Collectors.toList());
        stats.put("byDate", byDate);

        // Hot leads count
        long hotLeads = all.stream().filter(w -> "HOT".equals(w.getStatus())).count();
        stats.put("hotLeads", hotLeads);

        // Pending follow-ups (nextFollowUpDate <= today)
        LocalDate today = LocalDate.now();
        long pendingFollowUps = all.stream()
                .filter(w -> w.getNextFollowUpDate() != null && !w.getNextFollowUpDate().isAfter(today))
                .count();
        stats.put("pendingFollowUps", pendingFollowUps);

        return stats;
    }
}
