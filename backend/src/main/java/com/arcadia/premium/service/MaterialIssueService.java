package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateIssueRequest;
import com.arcadia.premium.dto.MaterialIssueDto;
import com.arcadia.premium.model.MaterialIssue;
import com.arcadia.premium.model.MaterialIssueItem;
import com.arcadia.premium.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialIssueService {

    private final MaterialIssueRepository repo;
    private final ProjectRepository projectRepo;
    private final MaterialRequisitionRepository requisitionRepo;
    private final WarehouseRepository warehouseRepo;
    private final MaterialMasterRepository materialRepo;

    public MaterialIssueService(MaterialIssueRepository repo, ProjectRepository projectRepo,
                                 MaterialRequisitionRepository requisitionRepo, WarehouseRepository warehouseRepo,
                                 MaterialMasterRepository materialRepo) {
        this.repo = repo;
        this.projectRepo = projectRepo;
        this.requisitionRepo = requisitionRepo;
        this.warehouseRepo = warehouseRepo;
        this.materialRepo = materialRepo;
    }

    @Transactional
    public MaterialIssueDto create(CreateIssueRequest req, String createdBy) {
        MaterialIssue entity = new MaterialIssue();
        entity.setIssueNo(generateNumber());
        entity.setProject(projectRepo.findById(req.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found: " + req.getProjectId())));
        if (req.getRequisitionId() != null) {
            entity.setRequisition(requisitionRepo.findById(req.getRequisitionId())
                    .orElseThrow(() -> new RuntimeException("Requisition not found: " + req.getRequisitionId())));
        }
        entity.setWarehouse(warehouseRepo.findById(req.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found: " + req.getWarehouseId())));
        entity.setIssueDate(req.getIssueDate());
        entity.setIssuedToEmployee(req.getIssuedToEmployee());
        entity.setIssuedToContractor(req.getIssuedToContractor());
        entity.setRemarks(req.getRemarks());
        entity.setCreatedBy(createdBy);

        if (req.getItems() != null) {
            for (var itemReq : req.getItems()) {
                MaterialIssueItem item = new MaterialIssueItem();
                item.setMaterialIssue(entity);
                item.setMaterial(materialRepo.findById(itemReq.getMaterialId())
                        .orElseThrow(() -> new RuntimeException("Material not found: " + itemReq.getMaterialId())));
                item.setUom(itemReq.getUom());
                item.setIssueQty(itemReq.getIssueQty());
                item.setRemarks(itemReq.getRemarks());
                entity.getItems().add(item);
            }
        }

        return MaterialIssueDto.fromEntity(repo.save(entity));
    }

    public List<MaterialIssueDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(MaterialIssueDto::fromEntity).collect(Collectors.toList());
    }

    public MaterialIssueDto getById(Long id) {
        return repo.findById(id).map(MaterialIssueDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("MaterialIssue not found: " + id));
    }

    public List<MaterialIssueDto> getByProject(Long projectId) {
        return repo.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(MaterialIssueDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }

    private String generateNumber() {
        String max = repo.findMaxIssueNo().orElse("ISS-000");
        int num = Integer.parseInt(max.replace("ISS-", "")) + 1;
        return String.format("ISS-%03d", num);
    }
}
