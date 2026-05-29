package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateMRNRequest;
import com.arcadia.premium.dto.MRNDto;
import com.arcadia.premium.model.MRNItem;
import com.arcadia.premium.model.MaterialReceiptNote;
import com.arcadia.premium.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MRNService {

    private final MaterialReceiptNoteRepository repo;
    private final ProjectRepository projectRepo;
    private final PurchaseOrderRepository poRepo;
    private final WarehouseRepository warehouseRepo;
    private final MaterialMasterRepository materialRepo;

    public MRNService(MaterialReceiptNoteRepository repo, ProjectRepository projectRepo,
                       PurchaseOrderRepository poRepo, WarehouseRepository warehouseRepo,
                       MaterialMasterRepository materialRepo) {
        this.repo = repo;
        this.projectRepo = projectRepo;
        this.poRepo = poRepo;
        this.warehouseRepo = warehouseRepo;
        this.materialRepo = materialRepo;
    }

    @Transactional
    public MRNDto create(CreateMRNRequest req, String createdBy) {
        MaterialReceiptNote entity = new MaterialReceiptNote();
        entity.setMrnNumber(generateNumber());
        entity.setProject(projectRepo.findById(req.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found: " + req.getProjectId())));
        if (req.getPurchaseOrderId() != null) {
            var po = poRepo.findById(req.getPurchaseOrderId())
                    .orElseThrow(() -> new RuntimeException("PO not found: " + req.getPurchaseOrderId()));
            entity.setPurchaseOrder(po);
            entity.setVendor(po.getVendor());
            entity.setReferenceType("FROM_PO");
        }
        entity.setMrnDate(req.getMrnDate());
        entity.setWarehouse(warehouseRepo.findById(req.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found: " + req.getWarehouseId())));
        entity.setRemarks(req.getRemarks());
        entity.setCreatedBy(createdBy);

        if (req.getItems() != null) {
            for (var itemReq : req.getItems()) {
                MRNItem item = new MRNItem();
                item.setMrn(entity);
                item.setMaterial(materialRepo.findById(itemReq.getMaterialId())
                        .orElseThrow(() -> new RuntimeException("Material not found: " + itemReq.getMaterialId())));
                item.setUom(itemReq.getUom());
                item.setMrnQty(itemReq.getMrnQty());
                item.setRemarks(itemReq.getRemarks());
                entity.getItems().add(item);
            }
        }

        return MRNDto.fromEntity(repo.save(entity));
    }

    public List<MRNDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream().map(MRNDto::fromEntity).collect(Collectors.toList());
    }

    public MRNDto getById(Long id) {
        return repo.findById(id).map(MRNDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("MRN not found: " + id));
    }

    public List<MRNDto> getByPurchaseOrder(Long poId) {
        return repo.findByPurchaseOrderIdOrderByCreatedAtDesc(poId).stream()
                .map(MRNDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public MRNDto updateStatus(Long id, String status) {
        MaterialReceiptNote entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MRN not found: " + id));
        entity.setGrnStatus(status);
        return MRNDto.fromEntity(repo.save(entity));
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }

    private String generateNumber() {
        String max = repo.findMaxMrnNumber().orElse("MRN-000");
        int num = Integer.parseInt(max.replace("MRN-", "")) + 1;
        return String.format("MRN-%03d", num);
    }
}
