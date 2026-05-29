package com.arcadia.premium.service;

import com.arcadia.premium.dto.MaterialSubGroupDto;
import com.arcadia.premium.model.MaterialGroup;
import com.arcadia.premium.model.MaterialSubGroup;
import com.arcadia.premium.repository.MaterialGroupRepository;
import com.arcadia.premium.repository.MaterialSubGroupRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialSubGroupService {

    private static final Logger log = LoggerFactory.getLogger(MaterialSubGroupService.class);

    private final MaterialSubGroupRepository repo;
    private final MaterialGroupRepository materialGroupRepo;

    public MaterialSubGroupService(MaterialSubGroupRepository repo,
                                   MaterialGroupRepository materialGroupRepo) {
        this.repo = repo;
        this.materialGroupRepo = materialGroupRepo;
    }

    public List<MaterialSubGroupDto> getAll() {
        return repo.findAllByOrderByNameAsc().stream()
                .map(MaterialSubGroupDto::fromEntity).collect(Collectors.toList());
    }

    public List<MaterialSubGroupDto> getByGroupId(Long groupId) {
        return repo.findByMaterialGroupIdOrderByNameAsc(groupId).stream()
                .map(MaterialSubGroupDto::fromEntity).collect(Collectors.toList());
    }

    public MaterialSubGroupDto getById(Long id) {
        return repo.findById(id)
                .map(MaterialSubGroupDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("MaterialSubGroup not found with id: " + id));
    }

    @Transactional
    public MaterialSubGroupDto create(MaterialSubGroupDto req) {
        MaterialGroup group = materialGroupRepo.findById(req.getMaterialGroupId())
                .orElseThrow(() -> new RuntimeException("MaterialGroup not found with id: " + req.getMaterialGroupId()));

        MaterialSubGroup sg = new MaterialSubGroup();
        sg.setName(req.getName().trim());
        sg.setDescription(req.getDescription());
        sg.setMaterialGroup(group);
        sg.setTolerancePercent(req.getTolerancePercent());
        sg.setActive(req.isActive());
        sg = repo.save(sg);
        log.info("Created material sub-group: {} (id={})", sg.getName(), sg.getId());
        return MaterialSubGroupDto.fromEntity(sg);
    }

    @Transactional
    public MaterialSubGroupDto update(Long id, MaterialSubGroupDto req) {
        MaterialSubGroup sg = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MaterialSubGroup not found with id: " + id));

        if (req.getMaterialGroupId() != null) {
            MaterialGroup group = materialGroupRepo.findById(req.getMaterialGroupId())
                    .orElseThrow(() -> new RuntimeException("MaterialGroup not found with id: " + req.getMaterialGroupId()));
            sg.setMaterialGroup(group);
        }

        sg.setName(req.getName().trim());
        sg.setDescription(req.getDescription());
        sg.setTolerancePercent(req.getTolerancePercent());
        sg.setActive(req.isActive());
        sg = repo.save(sg);
        log.info("Updated material sub-group: {} (id={})", sg.getName(), sg.getId());
        return MaterialSubGroupDto.fromEntity(sg);
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
        log.info("Deleted material sub-group id={}", id);
    }
}
