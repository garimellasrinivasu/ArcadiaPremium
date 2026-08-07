package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateGroundLevelWorkRequest;
import com.arcadia.premium.dto.GroundLevelWorkDto;
import com.arcadia.premium.model.GroundLevelWork;
import com.arcadia.premium.repository.GroundLevelWorkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroundLevelWorkService {

    private final GroundLevelWorkRepository repository;

    public GroundLevelWorkService(GroundLevelWorkRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public GroundLevelWorkDto create(CreateGroundLevelWorkRequest req, String createdBy) {
        GroundLevelWork entity = new GroundLevelWork();
        applyFields(entity, req);
        entity.setCreatedBy(createdBy);
        return GroundLevelWorkDto.fromEntity(repository.save(entity));
    }

    public List<GroundLevelWorkDto> getAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(GroundLevelWorkDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<GroundLevelWorkDto> getByProject(String projectName) {
        return repository.findByProjectNameOrderByCreatedAtDesc(projectName).stream()
                .map(GroundLevelWorkDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<GroundLevelWorkDto> getByProjectAndMonth(String projectName, String billMonth) {
        return repository.findByProjectNameAndBillMonthOrderByCreatedAtDesc(projectName, billMonth).stream()
                .map(GroundLevelWorkDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public GroundLevelWorkDto update(Long id, CreateGroundLevelWorkRequest req) {
        GroundLevelWork entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ground level work entry not found: " + id));
        applyFields(entity, req);
        return GroundLevelWorkDto.fromEntity(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    private void applyFields(GroundLevelWork entity, CreateGroundLevelWorkRequest req) {
        entity.setVehicleType(req.getVehicleType());
        entity.setStartDate(req.getStartDate());
        entity.setEndDate(req.getEndDate());
        entity.setNumberOfDays(req.getNumberOfDays());
        entity.setBreakdownDays(req.getBreakdownDays() != null ? req.getBreakdownDays() : 0);
        entity.setTotalWorkingDays(req.getTotalWorkingDays());
        entity.setRentPerDay(req.getRentPerDay());
        entity.setRentAmount(req.getRentAmount());
        entity.setDriverBatthaPerDay(req.getDriverBatthaPerDay());
        entity.setBatthaPaid(req.getBatthaPaid());
        entity.setOtherAdvance(req.getOtherAdvance());
        entity.setTotalNetPayable(req.getTotalNetPayable());
        entity.setBillMonth(req.getBillMonth());
        entity.setProjectName(req.getProjectName());
        entity.setRemarks(req.getRemarks());
    }
}
