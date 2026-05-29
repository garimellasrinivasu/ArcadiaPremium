package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateRABillRequest;
import com.arcadia.premium.dto.RABillDto;
import com.arcadia.premium.model.*;
import com.arcadia.premium.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RABillService {

    private final RABillRepository repo;
    private final RABillAdjustmentRepository adjustmentRepo;
    private final WorkOrderRepository woRepo;
    private final ActivityMasterRepository activityRepo;
    private final MeasurementBookRepository mbRepo;

    public RABillService(RABillRepository repo, RABillAdjustmentRepository adjustmentRepo,
                          WorkOrderRepository woRepo, ActivityMasterRepository activityRepo,
                          MeasurementBookRepository mbRepo) {
        this.repo = repo;
        this.adjustmentRepo = adjustmentRepo;
        this.woRepo = woRepo;
        this.activityRepo = activityRepo;
        this.mbRepo = mbRepo;
    }

    @Transactional
    public RABillDto create(CreateRABillRequest req, String createdBy) {
        RABill entity = new RABill();
        entity.setBillNo(generateNumber());
        WorkOrder wo = woRepo.findById(req.getWorkOrderId())
                .orElseThrow(() -> new RuntimeException("WorkOrder not found: " + req.getWorkOrderId()));
        entity.setWorkOrder(wo);
        entity.setContractor(wo.getContractor());
        entity.setProject(wo.getJob().getProject());
        entity.setBillDate(req.getBillDate());
        entity.setBillType(req.getBillType());
        entity.setAdvanceCategory(req.getAdvanceCategory());
        entity.setAdvancePercent(req.getAdvancePercent());
        entity.setAdvanceAmount(req.getAdvanceAmount() != null ? req.getAdvanceAmount() : BigDecimal.ZERO);
        entity.setRemarks(req.getRemarks());
        entity.setCreatedBy(createdBy);

        BigDecimal currentBillAmount = BigDecimal.ZERO;

        // Handle ADVANCE bill type
        if ("ADVANCE".equals(req.getBillType())) {
            currentBillAmount = entity.getAdvanceAmount();
        }

        // Handle WORK_DONE items
        if (req.getItems() != null) {
            for (var itemReq : req.getItems()) {
                RABillItem item = new RABillItem();
                item.setRaBill(entity);
                item.setActivity(activityRepo.findById(itemReq.getActivityId())
                        .orElseThrow(() -> new RuntimeException("Activity not found: " + itemReq.getActivityId())));
                if (itemReq.getMbId() != null) {
                    item.setMeasurementBook(mbRepo.findById(itemReq.getMbId())
                            .orElseThrow(() -> new RuntimeException("MB not found: " + itemReq.getMbId())));
                }
                item.setCurrentQty(itemReq.getCurrentQty());
                item.setWoRate(itemReq.getWoRate());
                item.setCumulativeQty(item.getPreviousQty().add(itemReq.getCurrentQty()));
                BigDecimal curAmount = itemReq.getCurrentQty().multiply(itemReq.getWoRate());
                item.setCurrentAmount(curAmount);
                item.setCumulativeAmount(item.getCumulativeQty().multiply(itemReq.getWoRate()));
                if (itemReq.getPaymentReleasePercent() != null) {
                    item.setPaymentReleasePercent(itemReq.getPaymentReleasePercent());
                }
                currentBillAmount = currentBillAmount.add(curAmount);
                entity.getItems().add(item);
            }
        }

        entity.setCurrentBillAmount(currentBillAmount);
        entity.setCumulativeBillAmount(entity.getPreviousBillAmount().add(currentBillAmount));
        entity.setNetPayable(currentBillAmount
                .subtract(entity.getRetentionAmount())
                .subtract(entity.getAdvanceRecoveryAmount())
                .subtract(entity.getDeductionAmount())
                .add(entity.getRetentionReleaseAmount())
                .add(entity.getDeductionReleaseAmount())
                .add(entity.getTaxAmount()));

        RABill saved = repo.save(entity);

        // Save adjustments
        if (req.getAdjustments() != null) {
            for (var adjReq : req.getAdjustments()) {
                RABillAdjustment adj = new RABillAdjustment();
                adj.setRaBill(saved);
                adj.setAdjustmentType(adjReq.getAdjustmentType());
                adj.setNature(adjReq.getNature());
                adj.setDescription(adjReq.getDescription());
                adj.setAmount(adjReq.getAmount());
                adjustmentRepo.save(adj);
            }
        }

        List<RABillAdjustment> adjs = adjustmentRepo.findByRaBillIdOrderByIdAsc(saved.getId());
        return RABillDto.fromEntity(saved, adjs);
    }

    public List<RABillDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(RABillDto::fromEntity).collect(Collectors.toList());
    }

    public RABillDto getById(Long id) {
        RABill entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("RABill not found: " + id));
        List<RABillAdjustment> adjs = adjustmentRepo.findByRaBillIdOrderByIdAsc(id);
        return RABillDto.fromEntity(entity, adjs);
    }

    public List<RABillDto> getByWorkOrder(Long workOrderId) {
        return repo.findByWorkOrderIdOrderByCreatedAtDesc(workOrderId).stream()
                .map(RABillDto::fromEntity).collect(Collectors.toList());
    }

    public List<RABillDto> getByContractor(Long contractorId) {
        return repo.findByContractorIdOrderByCreatedAtDesc(contractorId).stream()
                .map(RABillDto::fromEntity).collect(Collectors.toList());
    }

    public List<RABillDto> getByBillType(String billType) {
        return repo.findByBillTypeOrderByCreatedAtDesc(billType).stream()
                .map(RABillDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public RABillDto updateStatus(Long id, String status) {
        RABill entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("RABill not found: " + id));
        entity.setStatus(status);
        if ("POSTED".equals(status)) {
            entity.setPosted(true);
        }
        List<RABillAdjustment> adjs = adjustmentRepo.findByRaBillIdOrderByIdAsc(id);
        return RABillDto.fromEntity(repo.save(entity), adjs);
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }

    private String generateNumber() {
        String max = repo.findMaxBillNo().orElse("RAB-000");
        int num = Integer.parseInt(max.replace("RAB-", "")) + 1;
        return String.format("RAB-%03d", num);
    }
}
