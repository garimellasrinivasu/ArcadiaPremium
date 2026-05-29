package com.arcadia.premium.service;

import com.arcadia.premium.dto.MaterialBOQDto;
import com.arcadia.premium.model.MaterialBOQ;
import com.arcadia.premium.model.MaterialMaster;
import com.arcadia.premium.model.Project;
import com.arcadia.premium.repository.MaterialBOQRepository;
import com.arcadia.premium.repository.MaterialMasterRepository;
import com.arcadia.premium.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialBOQService {

    private static final Logger log = LoggerFactory.getLogger(MaterialBOQService.class);

    private final MaterialBOQRepository repo;
    private final ProjectRepository projectRepo;
    private final MaterialMasterRepository materialRepo;

    public MaterialBOQService(MaterialBOQRepository repo,
                              ProjectRepository projectRepo,
                              MaterialMasterRepository materialRepo) {
        this.repo = repo;
        this.projectRepo = projectRepo;
        this.materialRepo = materialRepo;
    }

    @Transactional
    public MaterialBOQDto create(MaterialBOQDto req, String createdBy) {
        Project project = projectRepo.findById(req.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + req.getProjectId()));
        MaterialMaster material = materialRepo.findById(req.getMaterialId())
                .orElseThrow(() -> new RuntimeException("Material not found with id: " + req.getMaterialId()));

        MaterialBOQ boq = new MaterialBOQ();
        boq.setProject(project);
        boq.setUnitName(req.getUnitName());
        boq.setMaterial(material);
        boq.setBoqQuantity(req.getBoqQuantity() != null ? req.getBoqQuantity() : BigDecimal.ZERO);
        boq.setWastagePercent(req.getWastagePercent() != null ? req.getWastagePercent() : 0.0);
        boq.setEffectiveQuantity(calculateEffectiveQuantity(boq.getBoqQuantity(), boq.getWastagePercent()));
        boq.setStatus("DRAFT");
        boq.setRemarks(req.getRemarks());
        boq.setCreatedBy(createdBy);
        boq = repo.save(boq);
        log.info("Created material BOQ: project={} material={} (id={})", req.getProjectId(), req.getMaterialId(), boq.getId());
        return MaterialBOQDto.fromEntity(boq);
    }

    public List<MaterialBOQDto> getByProject(Long projectId) {
        return repo.findByProjectIdOrderByIdAsc(projectId).stream()
                .map(MaterialBOQDto::fromEntity).collect(Collectors.toList());
    }

    public List<MaterialBOQDto> getByProjectAndUnit(Long projectId, String unitName) {
        return repo.findByProjectIdAndUnitNameOrderByIdAsc(projectId, unitName).stream()
                .map(MaterialBOQDto::fromEntity).collect(Collectors.toList());
    }

    public List<MaterialBOQDto> getByMaterial(Long materialId) {
        return repo.findByMaterialIdOrderByIdAsc(materialId).stream()
                .map(MaterialBOQDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public MaterialBOQDto update(Long id, MaterialBOQDto req) {
        MaterialBOQ boq = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MaterialBOQ not found with id: " + id));

        if (req.getMaterialId() != null) {
            MaterialMaster material = materialRepo.findById(req.getMaterialId())
                    .orElseThrow(() -> new RuntimeException("Material not found with id: " + req.getMaterialId()));
            boq.setMaterial(material);
        }

        boq.setUnitName(req.getUnitName());
        boq.setBoqQuantity(req.getBoqQuantity() != null ? req.getBoqQuantity() : BigDecimal.ZERO);
        boq.setWastagePercent(req.getWastagePercent() != null ? req.getWastagePercent() : 0.0);
        boq.setEffectiveQuantity(calculateEffectiveQuantity(boq.getBoqQuantity(), boq.getWastagePercent()));
        boq.setRemarks(req.getRemarks());
        boq = repo.save(boq);
        log.info("Updated material BOQ id={}", id);
        return MaterialBOQDto.fromEntity(boq);
    }

    @Transactional
    public MaterialBOQDto approve(Long id, String approverName) {
        MaterialBOQ boq = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MaterialBOQ not found with id: " + id));
        boq.setStatus("APPROVED");
        boq.setApprovedBy(approverName);
        boq = repo.save(boq);
        log.info("Approved material BOQ id={} by {}", id, approverName);
        return MaterialBOQDto.fromEntity(boq);
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
        log.info("Deleted material BOQ id={}", id);
    }

    private BigDecimal calculateEffectiveQuantity(BigDecimal boqQuantity, Double wastagePercent) {
        if (boqQuantity == null) return BigDecimal.ZERO;
        double wastage = wastagePercent != null ? wastagePercent : 0.0;
        BigDecimal factor = BigDecimal.ONE.add(BigDecimal.valueOf(wastage / 100.0));
        return boqQuantity.multiply(factor).setScale(4, RoundingMode.HALF_UP);
    }
}
