package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateWorkOrderItemRequest;
import com.arcadia.premium.dto.CreateWorkOrderRequest;
import com.arcadia.premium.dto.WorkOrderDto;
import com.arcadia.premium.model.ActivityMaster;
import com.arcadia.premium.model.Contractor;
import com.arcadia.premium.model.Job;
import com.arcadia.premium.model.WorkOrder;
import com.arcadia.premium.model.WorkOrderItem;
import com.arcadia.premium.repository.ActivityMasterRepository;
import com.arcadia.premium.repository.ContractorRepository;
import com.arcadia.premium.repository.JobRepository;
import com.arcadia.premium.repository.WorkOrderItemRepository;
import com.arcadia.premium.repository.WorkOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkOrderService {

    private final WorkOrderRepository repository;
    private final WorkOrderItemRepository workOrderItemRepository;
    private final JobRepository jobRepository;
    private final ContractorRepository contractorRepository;
    private final ActivityMasterRepository activityMasterRepository;

    public WorkOrderService(WorkOrderRepository repository,
                            WorkOrderItemRepository workOrderItemRepository,
                            JobRepository jobRepository,
                            ContractorRepository contractorRepository,
                            ActivityMasterRepository activityMasterRepository) {
        this.repository = repository;
        this.workOrderItemRepository = workOrderItemRepository;
        this.jobRepository = jobRepository;
        this.contractorRepository = contractorRepository;
        this.activityMasterRepository = activityMasterRepository;
    }

    @Transactional
    public WorkOrderDto create(CreateWorkOrderRequest req, String createdBy) {
        // Generate WO number
        String woNumber = generateWoNumber();

        Job job = jobRepository.findById(req.getJobId())
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + req.getJobId()));
        Contractor contractor = contractorRepository.findById(req.getContractorId())
                .orElseThrow(() -> new RuntimeException("Contractor not found with id: " + req.getContractorId()));

        WorkOrder e = new WorkOrder();
        e.setWoNumber(woNumber);
        e.setJob(job);
        e.setContractor(contractor);
        e.setWoDate(req.getWoDate());
        e.setStartDate(req.getStartDate());
        e.setEndDate(req.getEndDate());
        e.setTermsAndConditions(req.getTermsAndConditions());
        e.setRemarks(req.getRemarks());
        e.setContractType(req.getContractType());
        e.setWoAdvanceType(req.getWoAdvanceType());
        e.setWoAdvanceValue(req.getWoAdvanceValue());
        e.setWoRetentionType(req.getWoRetentionType());
        e.setWoRetentionValue(req.getWoRetentionValue());
        e.setWorkDuration(req.getWorkDuration());
        e.setDefectLiabilityPeriod(req.getDefectLiabilityPeriod());
        e.setDateOfCompletion(req.getDateOfCompletion());
        e.setContactPerson(req.getContactPerson());
        e.setWorkOrderTitle(req.getWorkOrderTitle());
        e.setCreatedBy(createdBy);

        // Process items
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<WorkOrderItem> items = new ArrayList<>();
        if (req.getItems() != null) {
            for (CreateWorkOrderItemRequest itemReq : req.getItems()) {
                ActivityMaster activity = activityMasterRepository.findById(itemReq.getActivityId())
                        .orElseThrow(() -> new RuntimeException("Activity not found with id: " + itemReq.getActivityId()));

                WorkOrderItem item = new WorkOrderItem();
                item.setWorkOrder(e);
                item.setActivity(activity);
                item.setDescription(itemReq.getDescription());
                item.setUom(itemReq.getUom());
                item.setQuantity(itemReq.getQuantity() != null ? itemReq.getQuantity() : BigDecimal.ZERO);
                item.setRate(itemReq.getRate() != null ? itemReq.getRate() : BigDecimal.ZERO);
                item.setAmount(item.getQuantity().multiply(item.getRate()));

                items.add(item);
                totalAmount = totalAmount.add(item.getAmount());
            }
        }

        e.setItems(items);
        e.setTotalAmount(totalAmount);

        return WorkOrderDto.fromEntity(repository.save(e));
    }

    public List<WorkOrderDto> getAll() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream().map(WorkOrderDto::fromEntity).collect(Collectors.toList());
    }

    public List<WorkOrderDto> getByJob(Long jobId) {
        return repository.findByJobIdOrderByCreatedAtDesc(jobId)
                .stream().map(WorkOrderDto::fromEntity).collect(Collectors.toList());
    }

    public List<WorkOrderDto> getByContractor(Long contractorId) {
        return repository.findByContractorIdOrderByCreatedAtDesc(contractorId)
                .stream().map(WorkOrderDto::fromEntity).collect(Collectors.toList());
    }

    public WorkOrderDto getById(Long id) {
        WorkOrder e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Work Order not found with id: " + id));
        return WorkOrderDto.fromEntity(e);
    }

    public WorkOrderDto updateStatus(Long id, String status) {
        WorkOrder e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Work Order not found with id: " + id));
        e.setStatus(status);
        return WorkOrderDto.fromEntity(repository.save(e));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private String generateWoNumber() {
        String maxWo = repository.findMaxWoNumber().orElse(null);
        int nextNum = 1;
        if (maxWo != null && maxWo.startsWith("WO-")) {
            try {
                nextNum = Integer.parseInt(maxWo.substring(3)) + 1;
            } catch (NumberFormatException ignored) {
                // fallback to 1
            }
        }
        return String.format("WO-%03d", nextNum);
    }
}
