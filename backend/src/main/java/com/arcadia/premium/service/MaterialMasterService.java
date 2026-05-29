package com.arcadia.premium.service;

import com.arcadia.premium.dto.MaterialMasterDto;
import com.arcadia.premium.model.MaterialGroup;
import com.arcadia.premium.model.MaterialMaster;
import com.arcadia.premium.model.MaterialSubGroup;
import com.arcadia.premium.repository.MaterialGroupRepository;
import com.arcadia.premium.repository.MaterialMasterRepository;
import com.arcadia.premium.repository.MaterialSubGroupRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialMasterService {

    private static final Logger log = LoggerFactory.getLogger(MaterialMasterService.class);

    private final MaterialMasterRepository repo;
    private final MaterialGroupRepository materialGroupRepo;
    private final MaterialSubGroupRepository materialSubGroupRepo;

    public MaterialMasterService(MaterialMasterRepository repo,
                                 MaterialGroupRepository materialGroupRepo,
                                 MaterialSubGroupRepository materialSubGroupRepo) {
        this.repo = repo;
        this.materialGroupRepo = materialGroupRepo;
        this.materialSubGroupRepo = materialSubGroupRepo;
    }

    public List<MaterialMasterDto> getAll() {
        return repo.findAllByOrderByNameAsc().stream()
                .map(MaterialMasterDto::fromEntity).collect(Collectors.toList());
    }

    public List<MaterialMasterDto> getActive() {
        return repo.findByActiveTrueOrderByNameAsc().stream()
                .map(MaterialMasterDto::fromEntity).collect(Collectors.toList());
    }

    public List<MaterialMasterDto> getByGroupId(Long groupId) {
        return repo.findByMaterialGroupIdOrderByNameAsc(groupId).stream()
                .map(MaterialMasterDto::fromEntity).collect(Collectors.toList());
    }

    public List<MaterialMasterDto> getBySubGroupId(Long subGroupId) {
        return repo.findByMaterialSubGroupIdOrderByNameAsc(subGroupId).stream()
                .map(MaterialMasterDto::fromEntity).collect(Collectors.toList());
    }

    public MaterialMasterDto getById(Long id) {
        return repo.findById(id)
                .map(MaterialMasterDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("MaterialMaster not found with id: " + id));
    }

    @Transactional
    public MaterialMasterDto create(MaterialMasterDto req) {
        MaterialGroup group = materialGroupRepo.findById(req.getMaterialGroupId())
                .orElseThrow(() -> new RuntimeException("MaterialGroup not found with id: " + req.getMaterialGroupId()));

        MaterialMaster m = new MaterialMaster();
        m.setName(req.getName().trim());
        m.setDescription(req.getDescription());
        m.setMaterialGroup(group);

        if (req.getMaterialSubGroupId() != null) {
            MaterialSubGroup subGroup = materialSubGroupRepo.findById(req.getMaterialSubGroupId())
                    .orElseThrow(() -> new RuntimeException("MaterialSubGroup not found with id: " + req.getMaterialSubGroupId()));
            m.setMaterialSubGroup(subGroup);
        }

        m.setUom(req.getUom());
        m.setHsnCode(req.getHsnCode());
        m.setBrand(req.getBrand());
        m.setActive(req.isActive());
        m = repo.save(m);
        log.info("Created material: {} (id={})", m.getName(), m.getId());
        return MaterialMasterDto.fromEntity(m);
    }

    @Transactional
    public MaterialMasterDto update(Long id, MaterialMasterDto req) {
        MaterialMaster m = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MaterialMaster not found with id: " + id));

        if (req.getMaterialGroupId() != null) {
            MaterialGroup group = materialGroupRepo.findById(req.getMaterialGroupId())
                    .orElseThrow(() -> new RuntimeException("MaterialGroup not found with id: " + req.getMaterialGroupId()));
            m.setMaterialGroup(group);
        }

        if (req.getMaterialSubGroupId() != null) {
            MaterialSubGroup subGroup = materialSubGroupRepo.findById(req.getMaterialSubGroupId())
                    .orElseThrow(() -> new RuntimeException("MaterialSubGroup not found with id: " + req.getMaterialSubGroupId()));
            m.setMaterialSubGroup(subGroup);
        } else {
            m.setMaterialSubGroup(null);
        }

        m.setName(req.getName().trim());
        m.setDescription(req.getDescription());
        m.setUom(req.getUom());
        m.setHsnCode(req.getHsnCode());
        m.setBrand(req.getBrand());
        m.setActive(req.isActive());
        m = repo.save(m);
        log.info("Updated material: {} (id={})", m.getName(), m.getId());
        return MaterialMasterDto.fromEntity(m);
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
        log.info("Deleted material id={}", id);
    }
}
