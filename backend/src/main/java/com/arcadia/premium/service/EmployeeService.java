package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateEmployeeRequest;
import com.arcadia.premium.dto.EmployeeDto;
import com.arcadia.premium.model.Employee;
import com.arcadia.premium.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository repository;

    public EmployeeService(EmployeeRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public EmployeeDto create(CreateEmployeeRequest req) {
        if (repository.findByEmployeeId(req.getEmployeeId()).isPresent()) {
            throw new RuntimeException("Employee with ID " + req.getEmployeeId() + " already exists");
        }
        Employee entity = new Employee();
        applyFields(entity, req);
        return EmployeeDto.fromEntity(repository.save(entity));
    }

    public List<EmployeeDto> getAll() {
        return repository.findByActiveTrueOrderByNameAsc().stream()
                .map(EmployeeDto::fromEntity)
                .collect(Collectors.toList());
    }

    public EmployeeDto getById(Long id) {
        Employee entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        return EmployeeDto.fromEntity(entity);
    }

    @Transactional
    public EmployeeDto update(Long id, CreateEmployeeRequest req) {
        Employee entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        applyFields(entity, req);
        return EmployeeDto.fromEntity(repository.save(entity));
    }

    @Transactional
    public void deactivate(Long id) {
        Employee entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        entity.setActive(false);
        repository.save(entity);
    }

    private void applyFields(Employee entity, CreateEmployeeRequest req) {
        entity.setEmployeeId(req.getEmployeeId());
        entity.setName(req.getName());
        entity.setDesignation(req.getDesignation());
        entity.setDepartment(req.getDepartment());
        entity.setDateOfJoining(req.getDateOfJoining());
        entity.setPanNo(req.getPanNo());
        entity.setEmail(req.getEmail());
        entity.setPhone(req.getPhone());
        entity.setBasicSalary(req.getBasicSalary());
        entity.setHra(req.getHra());
        entity.setSpecialAllowances(req.getSpecialAllowances());
        entity.setPfPercentage(req.getPfPercentage());
        entity.setEsiPercentage(req.getEsiPercentage());
        entity.setProfessionalTax(req.getProfessionalTax());
        entity.setActive(req.isActive());
    }
}
