package com.arcadia.premium.service;

import com.arcadia.premium.dto.ContractorDto;
import com.arcadia.premium.dto.CreateContractorRequest;
import com.arcadia.premium.model.Contractor;
import com.arcadia.premium.repository.ContractorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContractorService {

    private final ContractorRepository repository;

    public ContractorService(ContractorRepository repository) {
        this.repository = repository;
    }

    public ContractorDto create(CreateContractorRequest req, String createdBy) {
        Contractor e = new Contractor();
        e.setName(req.getName());
        e.setContactPerson(req.getContactPerson());
        e.setPhone(req.getPhone());
        e.setEmail(req.getEmail());
        e.setAddress(req.getAddress());
        e.setCity(req.getCity());
        e.setState(req.getState());
        e.setPincode(req.getPincode());
        e.setPan(req.getPan());
        e.setGstNo(req.getGstNo());
        e.setContractorType(req.getContractorType());
        e.setTrade(req.getTrade());
        e.setBankAccountName(req.getBankAccountName());
        e.setBankAccountNo(req.getBankAccountNo());
        e.setBankName(req.getBankName());
        e.setBankBranch(req.getBankBranch());
        e.setIfscCode(req.getIfscCode());
        e.setActive(req.isActive());
        e.setRemarks(req.getRemarks());
        e.setCreatedBy(createdBy);
        return ContractorDto.fromEntity(repository.save(e));
    }

    public List<ContractorDto> getAll() {
        return repository.findAllByOrderByNameAsc()
                .stream().map(ContractorDto::fromEntity).collect(Collectors.toList());
    }

    public List<ContractorDto> getActive() {
        return repository.findByActiveTrueOrderByNameAsc()
                .stream().map(ContractorDto::fromEntity).collect(Collectors.toList());
    }

    public List<ContractorDto> getByType(String type) {
        return repository.findByContractorTypeOrderByNameAsc(type)
                .stream().map(ContractorDto::fromEntity).collect(Collectors.toList());
    }

    public List<ContractorDto> search(String name) {
        return repository.findByNameContainingIgnoreCaseOrderByNameAsc(name)
                .stream().map(ContractorDto::fromEntity).collect(Collectors.toList());
    }

    public ContractorDto getById(Long id) {
        Contractor e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contractor not found with id: " + id));
        return ContractorDto.fromEntity(e);
    }

    public ContractorDto update(Long id, CreateContractorRequest req) {
        Contractor e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contractor not found with id: " + id));
        e.setName(req.getName());
        e.setContactPerson(req.getContactPerson());
        e.setPhone(req.getPhone());
        e.setEmail(req.getEmail());
        e.setAddress(req.getAddress());
        e.setCity(req.getCity());
        e.setState(req.getState());
        e.setPincode(req.getPincode());
        e.setPan(req.getPan());
        e.setGstNo(req.getGstNo());
        e.setContractorType(req.getContractorType());
        e.setTrade(req.getTrade());
        e.setBankAccountName(req.getBankAccountName());
        e.setBankAccountNo(req.getBankAccountNo());
        e.setBankName(req.getBankName());
        e.setBankBranch(req.getBankBranch());
        e.setIfscCode(req.getIfscCode());
        e.setActive(req.isActive());
        e.setRemarks(req.getRemarks());
        return ContractorDto.fromEntity(repository.save(e));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public ContractorDto toggleActive(Long id) {
        Contractor e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contractor not found with id: " + id));
        e.setActive(!e.isActive());
        return ContractorDto.fromEntity(repository.save(e));
    }
}
