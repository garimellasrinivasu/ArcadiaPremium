package com.arcadia.premium.service;

import com.arcadia.premium.dto.StockTransferDto;
import com.arcadia.premium.model.StockTransfer;
import com.arcadia.premium.model.StockTransferItem;
import com.arcadia.premium.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StockTransferService {

    private final StockTransferRepository repo;
    private final ProjectRepository projectRepo;
    private final WarehouseRepository warehouseRepo;
    private final MaterialMasterRepository materialRepo;

    public StockTransferService(StockTransferRepository repo, ProjectRepository projectRepo,
                                 WarehouseRepository warehouseRepo, MaterialMasterRepository materialRepo) {
        this.repo = repo;
        this.projectRepo = projectRepo;
        this.warehouseRepo = warehouseRepo;
        this.materialRepo = materialRepo;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public StockTransferDto create(Map<String, Object> req, String createdBy) {
        StockTransfer entity = new StockTransfer();
        entity.setTransferNo(generateNumber());
        Long fromProjectId = Long.valueOf(req.get("fromProjectId").toString());
        Long toProjectId = Long.valueOf(req.get("toProjectId").toString());
        entity.setFromProject(projectRepo.findById(fromProjectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + fromProjectId)));
        entity.setToProject(projectRepo.findById(toProjectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + toProjectId)));
        Long fromWhId = Long.valueOf(req.get("fromWarehouseId").toString());
        entity.setFromWarehouse(warehouseRepo.findById(fromWhId)
                .orElseThrow(() -> new RuntimeException("Warehouse not found: " + fromWhId)));
        if (req.get("toWarehouseId") != null) {
            Long toWhId = Long.valueOf(req.get("toWarehouseId").toString());
            entity.setToWarehouse(warehouseRepo.findById(toWhId)
                    .orElseThrow(() -> new RuntimeException("Warehouse not found: " + toWhId)));
        }
        entity.setTransferType((String) req.get("transferType"));
        entity.setTransferDate(LocalDate.parse(req.get("transferDate").toString()));
        entity.setRemarks((String) req.get("remarks"));
        entity.setCreatedBy(createdBy);

        List<Map<String, Object>> items = (List<Map<String, Object>>) req.get("items");
        if (items != null) {
            for (var itemMap : items) {
                StockTransferItem item = new StockTransferItem();
                item.setStockTransfer(entity);
                Long matId = Long.valueOf(itemMap.get("materialId").toString());
                item.setMaterial(materialRepo.findById(matId)
                        .orElseThrow(() -> new RuntimeException("Material not found: " + matId)));
                item.setUom((String) itemMap.get("uom"));
                item.setTransferQty(new BigDecimal(itemMap.get("transferQty").toString()));
                item.setRemarks((String) itemMap.get("remarks"));
                entity.getItems().add(item);
            }
        }

        return StockTransferDto.fromEntity(repo.save(entity));
    }

    public List<StockTransferDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(StockTransferDto::fromEntity).collect(Collectors.toList());
    }

    public StockTransferDto getById(Long id) {
        return repo.findById(id).map(StockTransferDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("StockTransfer not found: " + id));
    }

    public List<StockTransferDto> getByFromProject(Long projectId) {
        return repo.findByFromProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(StockTransferDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public StockTransferDto updateStatus(Long id, String status) {
        StockTransfer entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("StockTransfer not found: " + id));
        entity.setStatus(status);
        return StockTransferDto.fromEntity(repo.save(entity));
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }

    private String generateNumber() {
        String max = repo.findMaxTransferNo().orElse("ST-000");
        int num = Integer.parseInt(max.replace("ST-", "")) + 1;
        return String.format("ST-%03d", num);
    }
}
