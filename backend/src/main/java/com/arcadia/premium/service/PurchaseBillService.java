package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreatePurchaseBillRequest;
import com.arcadia.premium.dto.PurchaseBillDto;
import com.arcadia.premium.model.PurchaseBill;
import com.arcadia.premium.model.PurchaseBillItem;
import com.arcadia.premium.repository.MaterialMasterRepository;
import com.arcadia.premium.repository.PurchaseBillRepository;
import com.arcadia.premium.repository.PurchaseOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PurchaseBillService {

    private final PurchaseBillRepository repo;
    private final PurchaseOrderRepository poRepo;
    private final MaterialMasterRepository materialRepo;

    public PurchaseBillService(PurchaseBillRepository repo, PurchaseOrderRepository poRepo,
                                MaterialMasterRepository materialRepo) {
        this.repo = repo;
        this.poRepo = poRepo;
        this.materialRepo = materialRepo;
    }

    @Transactional
    public PurchaseBillDto create(CreatePurchaseBillRequest req, String createdBy) {
        PurchaseBill entity = new PurchaseBill();
        entity.setBillNo(generateNumber());
        var po = poRepo.findById(req.getPurchaseOrderId())
                .orElseThrow(() -> new RuntimeException("PO not found: " + req.getPurchaseOrderId()));
        entity.setPurchaseOrder(po);
        entity.setVendor(po.getVendor());
        entity.setBillDate(req.getBillDate());
        entity.setVendorInvoiceNo(req.getVendorInvoiceNo());
        entity.setVendorInvoiceDate(req.getVendorInvoiceDate());
        entity.setDiscount(req.getDiscount() != null ? req.getDiscount() : BigDecimal.ZERO);
        entity.setFreightCharges(req.getFreightCharges() != null ? req.getFreightCharges() : BigDecimal.ZERO);
        entity.setTaxAmount(req.getTaxAmount() != null ? req.getTaxAmount() : BigDecimal.ZERO);
        entity.setRemarks(req.getRemarks());
        entity.setCreatedBy(createdBy);

        BigDecimal totalBillAmount = BigDecimal.ZERO;
        if (req.getItems() != null) {
            for (var itemReq : req.getItems()) {
                PurchaseBillItem item = new PurchaseBillItem();
                item.setPurchaseBill(entity);
                item.setMaterial(materialRepo.findById(itemReq.getMaterialId())
                        .orElseThrow(() -> new RuntimeException("Material not found: " + itemReq.getMaterialId())));
                item.setUom(itemReq.getUom());
                item.setBillQty(itemReq.getBillQty());
                item.setRate(itemReq.getRate());
                BigDecimal amount = itemReq.getBillQty().multiply(itemReq.getRate());
                item.setAmount(amount);
                totalBillAmount = totalBillAmount.add(amount);
                entity.getItems().add(item);
            }
        }
        entity.setTotalBillAmount(totalBillAmount);
        BigDecimal netAmount = totalBillAmount
                .add(entity.getFreightCharges())
                .add(entity.getTaxAmount())
                .subtract(entity.getDiscount())
                .subtract(entity.getRecoveryAmount());
        entity.setNetAmount(netAmount);

        return PurchaseBillDto.fromEntity(repo.save(entity));
    }

    public List<PurchaseBillDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(PurchaseBillDto::fromEntity).collect(Collectors.toList());
    }

    public PurchaseBillDto getById(Long id) {
        return repo.findById(id).map(PurchaseBillDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("PurchaseBill not found: " + id));
    }

    public List<PurchaseBillDto> getByPurchaseOrder(Long poId) {
        return repo.findByPurchaseOrderIdOrderByCreatedAtDesc(poId).stream()
                .map(PurchaseBillDto::fromEntity).collect(Collectors.toList());
    }

    public List<PurchaseBillDto> getByVendor(Long vendorId) {
        return repo.findByVendorIdOrderByCreatedAtDesc(vendorId).stream()
                .map(PurchaseBillDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public PurchaseBillDto updateStatus(Long id, String status) {
        PurchaseBill entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("PurchaseBill not found: " + id));
        entity.setStatus(status);
        return PurchaseBillDto.fromEntity(repo.save(entity));
    }

    @Transactional
    public PurchaseBillDto uploadInvoice(Long id, String fileBase64, String fileName) {
        PurchaseBill entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("PurchaseBill not found: " + id));
        entity.setVendorInvoiceFile(fileBase64);
        entity.setVendorInvoiceFileName(fileName);
        return PurchaseBillDto.fromEntity(repo.save(entity));
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }

    private String generateNumber() {
        String max = repo.findMaxBillNo().orElse("PB-000");
        int num = Integer.parseInt(max.replace("PB-", "")) + 1;
        return String.format("PB-%03d", num);
    }
}
