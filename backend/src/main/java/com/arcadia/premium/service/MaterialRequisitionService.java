package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateRequisitionRequest;
import com.arcadia.premium.dto.MaterialRequisitionDto;
import com.arcadia.premium.model.MaterialRequisition;
import com.arcadia.premium.model.RequisitionItem;
import com.arcadia.premium.repository.MaterialMasterRepository;
import com.arcadia.premium.repository.MaterialRequisitionRepository;
import com.arcadia.premium.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialRequisitionService {

    private final MaterialRequisitionRepository repo;
    private final ProjectRepository projectRepo;
    private final MaterialMasterRepository materialRepo;

    public MaterialRequisitionService(MaterialRequisitionRepository repo,
                                       ProjectRepository projectRepo,
                                       MaterialMasterRepository materialRepo) {
        this.repo = repo;
        this.projectRepo = projectRepo;
        this.materialRepo = materialRepo;
    }

    @Transactional
    public MaterialRequisitionDto create(CreateRequisitionRequest req, String createdBy) {
        MaterialRequisition entity = new MaterialRequisition();
        entity.setRequisitionNo(generateNumber());
        entity.setProject(projectRepo.findById(req.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found: " + req.getProjectId())));
        entity.setUnitName(req.getUnitName());
        entity.setRequisitionDate(req.getRequisitionDate());
        entity.setRequiredDate(req.getRequiredDate());
        entity.setRemarks(req.getRemarks());
        entity.setCreatedBy(createdBy);

        if (req.getItems() != null) {
            for (var itemReq : req.getItems()) {
                RequisitionItem item = new RequisitionItem();
                item.setRequisition(entity);
                item.setMaterial(materialRepo.findById(itemReq.getMaterialId())
                        .orElseThrow(() -> new RuntimeException("Material not found: " + itemReq.getMaterialId())));
                item.setUom(itemReq.getUom());
                item.setRequisitionQty(itemReq.getRequisitionQty());
                item.setRemarks(itemReq.getRemarks());
                entity.getItems().add(item);
            }
        }

        return MaterialRequisitionDto.fromEntity(repo.save(entity));
    }

    public List<MaterialRequisitionDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(MaterialRequisitionDto::fromEntity).collect(Collectors.toList());
    }

    public MaterialRequisitionDto getById(Long id) {
        return repo.findById(id).map(MaterialRequisitionDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("MaterialRequisition not found: " + id));
    }

    public List<MaterialRequisitionDto> getByProject(Long projectId) {
        return repo.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(MaterialRequisitionDto::fromEntity).collect(Collectors.toList());
    }

    public List<MaterialRequisitionDto> getByStatus(String status) {
        return repo.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(MaterialRequisitionDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public MaterialRequisitionDto updateStatus(Long id, String status) {
        MaterialRequisition entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MaterialRequisition not found: " + id));
        entity.setStatus(status);
        return MaterialRequisitionDto.fromEntity(repo.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    private String generateNumber() {
        String max = repo.findMaxRequisitionNo().orElse("REQ-000");
        int num = Integer.parseInt(max.replace("REQ-", "")) + 1;
        return String.format("REQ-%03d", num);
    }
}
