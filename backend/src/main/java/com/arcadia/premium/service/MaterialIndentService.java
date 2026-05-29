package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateIndentRequest;
import com.arcadia.premium.dto.MaterialIndentDto;
import com.arcadia.premium.model.IndentItem;
import com.arcadia.premium.model.MaterialIndent;
import com.arcadia.premium.repository.MaterialIndentRepository;
import com.arcadia.premium.repository.MaterialMasterRepository;
import com.arcadia.premium.repository.MaterialRequisitionRepository;
import com.arcadia.premium.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialIndentService {

    private final MaterialIndentRepository repo;
    private final ProjectRepository projectRepo;
    private final MaterialMasterRepository materialRepo;
    private final MaterialRequisitionRepository requisitionRepo;

    public MaterialIndentService(MaterialIndentRepository repo, ProjectRepository projectRepo,
                                  MaterialMasterRepository materialRepo, MaterialRequisitionRepository requisitionRepo) {
        this.repo = repo;
        this.projectRepo = projectRepo;
        this.materialRepo = materialRepo;
        this.requisitionRepo = requisitionRepo;
    }

    @Transactional
    public MaterialIndentDto create(CreateIndentRequest req, String createdBy) {
        MaterialIndent entity = new MaterialIndent();
        entity.setIndentNo(generateNumber());
        entity.setProject(projectRepo.findById(req.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found: " + req.getProjectId())));
        entity.setIndentDate(req.getIndentDate());
        entity.setReferenceType(req.getReferenceType());
        if ("FROM_REQUISITION".equals(req.getReferenceType()) && req.getRequisitionId() != null) {
            entity.setRequisition(requisitionRepo.findById(req.getRequisitionId())
                    .orElseThrow(() -> new RuntimeException("Requisition not found: " + req.getRequisitionId())));
        }
        entity.setRemarks(req.getRemarks());
        entity.setCreatedBy(createdBy);

        if (req.getItems() != null) {
            for (var itemReq : req.getItems()) {
                IndentItem item = new IndentItem();
                item.setIndent(entity);
                item.setMaterial(materialRepo.findById(itemReq.getMaterialId())
                        .orElseThrow(() -> new RuntimeException("Material not found: " + itemReq.getMaterialId())));
                item.setUom(itemReq.getUom());
                item.setIndentQty(itemReq.getIndentQty());
                item.setRemarks(itemReq.getRemarks());
                entity.getItems().add(item);
            }
        }

        return MaterialIndentDto.fromEntity(repo.save(entity));
    }

    public List<MaterialIndentDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(MaterialIndentDto::fromEntity).collect(Collectors.toList());
    }

    public MaterialIndentDto getById(Long id) {
        return repo.findById(id).map(MaterialIndentDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("MaterialIndent not found: " + id));
    }

    public List<MaterialIndentDto> getByProject(Long projectId) {
        return repo.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(MaterialIndentDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public MaterialIndentDto updateStatus(Long id, String status) {
        MaterialIndent entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MaterialIndent not found: " + id));
        entity.setStatus(status);
        return MaterialIndentDto.fromEntity(repo.save(entity));
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }

    private String generateNumber() {
        String max = repo.findMaxIndentNo().orElse("IND-000");
        int num = Integer.parseInt(max.replace("IND-", "")) + 1;
        return String.format("IND-%03d", num);
    }
}
