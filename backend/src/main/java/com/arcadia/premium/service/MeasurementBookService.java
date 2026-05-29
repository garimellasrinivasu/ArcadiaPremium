package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateMBRequest;
import com.arcadia.premium.dto.MeasurementBookDto;
import com.arcadia.premium.model.MBItemDetail;
import com.arcadia.premium.model.MeasurementBook;
import com.arcadia.premium.model.MeasurementBookItem;
import com.arcadia.premium.model.WorkOrder;
import com.arcadia.premium.repository.ActivityMasterRepository;
import com.arcadia.premium.repository.MeasurementBookRepository;
import com.arcadia.premium.repository.WorkOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MeasurementBookService {

    private final MeasurementBookRepository repo;
    private final WorkOrderRepository woRepo;
    private final ActivityMasterRepository activityRepo;

    public MeasurementBookService(MeasurementBookRepository repo, WorkOrderRepository woRepo,
                                    ActivityMasterRepository activityRepo) {
        this.repo = repo;
        this.woRepo = woRepo;
        this.activityRepo = activityRepo;
    }

    @Transactional
    public MeasurementBookDto create(CreateMBRequest req, String createdBy) {
        MeasurementBook entity = new MeasurementBook();
        entity.setMbNumber(generateNumber());
        WorkOrder wo = woRepo.findById(req.getWorkOrderId())
                .orElseThrow(() -> new RuntimeException("WorkOrder not found: " + req.getWorkOrderId()));
        entity.setWorkOrder(wo);
        entity.setProject(wo.getJob().getProject());
        entity.setMbDate(req.getMbDate());
        entity.setRemarks(req.getRemarks());
        entity.setCreatedBy(createdBy);

        if (req.getItems() != null) {
            for (var itemReq : req.getItems()) {
                MeasurementBookItem mbItem = new MeasurementBookItem();
                mbItem.setMeasurementBook(entity);
                mbItem.setActivity(activityRepo.findById(itemReq.getActivityId())
                        .orElseThrow(() -> new RuntimeException("Activity not found: " + itemReq.getActivityId())));
                mbItem.setUom(itemReq.getUom());

                // Process LBH details and compute currentMeasuredQty
                BigDecimal totalQty = BigDecimal.ZERO;
                if (itemReq.getDetails() != null) {
                    for (var detailReq : itemReq.getDetails()) {
                        MBItemDetail detail = new MBItemDetail();
                        detail.setMbItem(mbItem);
                        detail.setItemNo(detailReq.getItemNo());
                        detail.setDescription(detailReq.getDescription());
                        detail.setOperand(detailReq.getOperand() != null ? detailReq.getOperand() : "ADDITION");
                        BigDecimal nos = detailReq.getNos() != null ? detailReq.getNos() : BigDecimal.ONE;
                        BigDecimal len = detailReq.getLength() != null ? detailReq.getLength() : BigDecimal.ONE;
                        BigDecimal brd = detailReq.getBreadth() != null ? detailReq.getBreadth() : BigDecimal.ONE;
                        BigDecimal hgt = detailReq.getHeight() != null ? detailReq.getHeight() : BigDecimal.ONE;
                        detail.setNos(nos);
                        detail.setLength(len);
                        detail.setBreadth(brd);
                        detail.setHeight(hgt);
                        BigDecimal quantity = nos.multiply(len).multiply(brd).multiply(hgt);
                        detail.setQuantity(quantity);
                        mbItem.getDetails().add(detail);

                        if ("DEDUCTION".equals(detail.getOperand())) {
                            totalQty = totalQty.subtract(quantity);
                        } else {
                            totalQty = totalQty.add(quantity);
                        }
                    }
                }

                BigDecimal currentQty = itemReq.getCurrentMeasuredQty() != null
                        ? itemReq.getCurrentMeasuredQty() : totalQty;
                mbItem.setCurrentMeasuredQty(currentQty);
                mbItem.setCumulativeMeasuredQty(mbItem.getPreviousMeasuredQty().add(currentQty));
                entity.getItems().add(mbItem);
            }
        }

        return MeasurementBookDto.fromEntity(repo.save(entity));
    }

    public List<MeasurementBookDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(MeasurementBookDto::fromEntity).collect(Collectors.toList());
    }

    public MeasurementBookDto getById(Long id) {
        return repo.findById(id).map(MeasurementBookDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("MeasurementBook not found: " + id));
    }

    public List<MeasurementBookDto> getByWorkOrder(Long workOrderId) {
        return repo.findByWorkOrderIdOrderByCreatedAtDesc(workOrderId).stream()
                .map(MeasurementBookDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public MeasurementBookDto updateStatus(Long id, String status) {
        MeasurementBook entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MeasurementBook not found: " + id));
        entity.setStatus(status);
        return MeasurementBookDto.fromEntity(repo.save(entity));
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }

    private String generateNumber() {
        String max = repo.findMaxMbNumber().orElse("MB-000");
        int num = Integer.parseInt(max.replace("MB-", "")) + 1;
        return String.format("MB-%03d", num);
    }
}
