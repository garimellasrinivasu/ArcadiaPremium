package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateGRNRequest;
import com.arcadia.premium.dto.GRNDto;
import com.arcadia.premium.model.GRNItem;
import com.arcadia.premium.model.GoodsReceiptNote;
import com.arcadia.premium.repository.GoodsReceiptNoteRepository;
import com.arcadia.premium.repository.MaterialMasterRepository;
import com.arcadia.premium.repository.MaterialReceiptNoteRepository;
import com.arcadia.premium.repository.WarehouseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GRNService {

    private final GoodsReceiptNoteRepository repo;
    private final MaterialReceiptNoteRepository mrnRepo;
    private final WarehouseRepository warehouseRepo;
    private final MaterialMasterRepository materialRepo;

    public GRNService(GoodsReceiptNoteRepository repo, MaterialReceiptNoteRepository mrnRepo,
                       WarehouseRepository warehouseRepo, MaterialMasterRepository materialRepo) {
        this.repo = repo;
        this.mrnRepo = mrnRepo;
        this.warehouseRepo = warehouseRepo;
        this.materialRepo = materialRepo;
    }

    @Transactional
    public GRNDto create(CreateGRNRequest req, String createdBy) {
        GoodsReceiptNote entity = new GoodsReceiptNote();
        entity.setGrnNumber(generateNumber());
        entity.setMrn(mrnRepo.findById(req.getMrnId())
                .orElseThrow(() -> new RuntimeException("MRN not found: " + req.getMrnId())));
        entity.setWarehouse(warehouseRepo.findById(req.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found: " + req.getWarehouseId())));
        entity.setGrnDate(req.getGrnDate());
        entity.setRemarks(req.getRemarks());
        entity.setCreatedBy(createdBy);

        if (req.getItems() != null) {
            for (var itemReq : req.getItems()) {
                GRNItem item = new GRNItem();
                item.setGrn(entity);
                item.setMaterial(materialRepo.findById(itemReq.getMaterialId())
                        .orElseThrow(() -> new RuntimeException("Material not found: " + itemReq.getMaterialId())));
                item.setUom(itemReq.getUom());
                item.setGrnQty(itemReq.getGrnQty());
                item.setAcceptedQty(itemReq.getAcceptedQty());
                item.setRejectedQty(itemReq.getRejectedQty());
                item.setInspectionType(itemReq.getInspectionType());
                item.setInspectedBy(itemReq.getInspectedBy());
                entity.getItems().add(item);
            }
        }

        return GRNDto.fromEntity(repo.save(entity));
    }

    public List<GRNDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream().map(GRNDto::fromEntity).collect(Collectors.toList());
    }

    public GRNDto getById(Long id) {
        return repo.findById(id).map(GRNDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("GRN not found: " + id));
    }

    public List<GRNDto> getByMrn(Long mrnId) {
        return repo.findByMrnIdOrderByCreatedAtDesc(mrnId).stream()
                .map(GRNDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }

    private String generateNumber() {
        String max = repo.findMaxGrnNumber().orElse("GRN-000");
        int num = Integer.parseInt(max.replace("GRN-", "")) + 1;
        return String.format("GRN-%03d", num);
    }
}
