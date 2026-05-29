package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateEstimationDOMRequest;
import com.arcadia.premium.dto.CreateJobEstimationRequest;
import com.arcadia.premium.dto.JobEstimationDto;
import com.arcadia.premium.model.ActivityMaster;
import com.arcadia.premium.model.EstimationDOM;
import com.arcadia.premium.model.Job;
import com.arcadia.premium.model.JobEstimation;
import com.arcadia.premium.repository.ActivityMasterRepository;
import com.arcadia.premium.repository.JobEstimationRepository;
import com.arcadia.premium.repository.JobRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobEstimationService {

    private final JobEstimationRepository repository;
    private final JobRepository jobRepository;
    private final ActivityMasterRepository activityMasterRepository;

    public JobEstimationService(JobEstimationRepository repository,
                                JobRepository jobRepository,
                                ActivityMasterRepository activityMasterRepository) {
        this.repository = repository;
        this.jobRepository = jobRepository;
        this.activityMasterRepository = activityMasterRepository;
    }

    @Transactional
    public JobEstimationDto create(CreateJobEstimationRequest req, String createdBy) {
        Job job = jobRepository.findById(req.getJobId())
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + req.getJobId()));
        ActivityMaster activity = activityMasterRepository.findById(req.getActivityId())
                .orElseThrow(() -> new RuntimeException("Activity not found with id: " + req.getActivityId()));

        JobEstimation e = new JobEstimation();
        e.setJob(job);
        e.setActivity(activity);
        e.setRate(req.getRate() != null ? req.getRate() : BigDecimal.ZERO);
        e.setRemarks(req.getRemarks());
        e.setCreatedBy(createdBy);

        // Process DOM details
        BigDecimal totalQuantity = BigDecimal.ZERO;
        List<EstimationDOM> domList = new ArrayList<>();
        if (req.getDomDetails() != null && !req.getDomDetails().isEmpty()) {
            for (CreateEstimationDOMRequest domReq : req.getDomDetails()) {
                EstimationDOM dom = new EstimationDOM();
                dom.setJobEstimation(e);
                dom.setItemNo(domReq.getItemNo());
                dom.setDescription(domReq.getDescription());
                dom.setNos(domReq.getNos() != null ? domReq.getNos() : BigDecimal.ONE);
                dom.setLength(domReq.getLength() != null ? domReq.getLength() : BigDecimal.ZERO);
                dom.setBreadth(domReq.getBreadth() != null ? domReq.getBreadth() : BigDecimal.ZERO);
                dom.setHeight(domReq.getHeight() != null ? domReq.getHeight() : BigDecimal.ZERO);

                // Compute quantity = nos * L * B * H
                BigDecimal qty = dom.getNos()
                        .multiply(dom.getLength())
                        .multiply(dom.getBreadth())
                        .multiply(dom.getHeight());
                dom.setQuantity(qty);
                domList.add(dom);
                totalQuantity = totalQuantity.add(qty);
            }
        } else {
            // Manual quantity
            totalQuantity = req.getQuantity() != null ? req.getQuantity() : BigDecimal.ZERO;
        }

        e.setDomDetails(domList);
        e.setQuantity(totalQuantity);
        e.setAmount(totalQuantity.multiply(e.getRate()));

        return JobEstimationDto.fromEntity(repository.save(e));
    }

    public List<JobEstimationDto> getByJob(Long jobId) {
        return repository.findByJobIdOrderByIdAsc(jobId)
                .stream().map(JobEstimationDto::fromEntity).collect(Collectors.toList());
    }

    public JobEstimationDto getById(Long id) {
        JobEstimation e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job Estimation not found with id: " + id));
        return JobEstimationDto.fromEntity(e);
    }

    @Transactional
    public JobEstimationDto update(Long id, CreateJobEstimationRequest req) {
        JobEstimation e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job Estimation not found with id: " + id));

        Job job = jobRepository.findById(req.getJobId())
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + req.getJobId()));
        ActivityMaster activity = activityMasterRepository.findById(req.getActivityId())
                .orElseThrow(() -> new RuntimeException("Activity not found with id: " + req.getActivityId()));

        e.setJob(job);
        e.setActivity(activity);
        e.setRate(req.getRate() != null ? req.getRate() : BigDecimal.ZERO);
        e.setRemarks(req.getRemarks());

        // Clear old DOM details and recompute
        e.getDomDetails().clear();

        BigDecimal totalQuantity = BigDecimal.ZERO;
        if (req.getDomDetails() != null && !req.getDomDetails().isEmpty()) {
            for (CreateEstimationDOMRequest domReq : req.getDomDetails()) {
                EstimationDOM dom = new EstimationDOM();
                dom.setJobEstimation(e);
                dom.setItemNo(domReq.getItemNo());
                dom.setDescription(domReq.getDescription());
                dom.setNos(domReq.getNos() != null ? domReq.getNos() : BigDecimal.ONE);
                dom.setLength(domReq.getLength() != null ? domReq.getLength() : BigDecimal.ZERO);
                dom.setBreadth(domReq.getBreadth() != null ? domReq.getBreadth() : BigDecimal.ZERO);
                dom.setHeight(domReq.getHeight() != null ? domReq.getHeight() : BigDecimal.ZERO);

                BigDecimal qty = dom.getNos()
                        .multiply(dom.getLength())
                        .multiply(dom.getBreadth())
                        .multiply(dom.getHeight());
                dom.setQuantity(qty);
                e.getDomDetails().add(dom);
                totalQuantity = totalQuantity.add(qty);
            }
        } else {
            totalQuantity = req.getQuantity() != null ? req.getQuantity() : BigDecimal.ZERO;
        }

        e.setQuantity(totalQuantity);
        e.setAmount(totalQuantity.multiply(e.getRate()));

        return JobEstimationDto.fromEntity(repository.save(e));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
