package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateVendorRequest;
import com.arcadia.premium.dto.VendorDto;
import com.arcadia.premium.model.Vendor;
import com.arcadia.premium.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VendorService {

    private static final Logger log = LoggerFactory.getLogger(VendorService.class);

    private final VendorRepository vendorRepo;

    public VendorService(VendorRepository vendorRepo) {
        this.vendorRepo = vendorRepo;
    }

    public List<VendorDto> getAll() {
        return vendorRepo.findAllByOrderByNameAsc().stream()
                .map(VendorDto::fromEntity).collect(Collectors.toList());
    }

    public List<VendorDto> getActive() {
        return vendorRepo.findByActiveTrueOrderByNameAsc().stream()
                .map(VendorDto::fromEntity).collect(Collectors.toList());
    }

    public List<VendorDto> search(String query) {
        return vendorRepo.findByNameContainingIgnoreCaseOrderByNameAsc(query).stream()
                .map(VendorDto::fromEntity).collect(Collectors.toList());
    }

    public VendorDto getById(Long id) {
        return vendorRepo.findById(id)
                .map(VendorDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));
    }

    @Transactional
    public VendorDto create(CreateVendorRequest req, String createdBy) {
        Vendor v = new Vendor();
        v.setName(req.getName().trim());
        v.setContactPerson(req.getContactPerson());
        v.setPhone(req.getPhone());
        v.setEmail(req.getEmail());
        v.setAddress(req.getAddress());
        v.setCity(req.getCity());
        v.setState(req.getState());
        v.setPincode(req.getPincode());
        v.setPan(req.getPan());
        v.setGstNo(req.getGstNo());
        v.setVendorType(req.getVendorType() != null ? req.getVendorType() : "MATERIAL_SUPPLIER");
        v.setTrade(req.getTrade());
        v.setBankAccountName(req.getBankAccountName());
        v.setBankAccountNo(req.getBankAccountNo());
        v.setBankName(req.getBankName());
        v.setBankBranch(req.getBankBranch());
        v.setIfscCode(req.getIfscCode());
        v.setActive(req.isActive());
        v.setRemarks(req.getRemarks());
        v.setCreatedBy(createdBy);
        v = vendorRepo.save(v);
        log.info("Created vendor: {} (id={})", v.getName(), v.getId());
        return VendorDto.fromEntity(v);
    }

    @Transactional
    public VendorDto update(Long id, CreateVendorRequest req) {
        Vendor v = vendorRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));
        v.setName(req.getName().trim());
        v.setContactPerson(req.getContactPerson());
        v.setPhone(req.getPhone());
        v.setEmail(req.getEmail());
        v.setAddress(req.getAddress());
        v.setCity(req.getCity());
        v.setState(req.getState());
        v.setPincode(req.getPincode());
        v.setPan(req.getPan());
        v.setGstNo(req.getGstNo());
        v.setVendorType(req.getVendorType());
        v.setTrade(req.getTrade());
        v.setBankAccountName(req.getBankAccountName());
        v.setBankAccountNo(req.getBankAccountNo());
        v.setBankName(req.getBankName());
        v.setBankBranch(req.getBankBranch());
        v.setIfscCode(req.getIfscCode());
        v.setActive(req.isActive());
        v.setRemarks(req.getRemarks());
        v = vendorRepo.save(v);
        log.info("Updated vendor: {} (id={})", v.getName(), v.getId());
        return VendorDto.fromEntity(v);
    }

    @Transactional
    public VendorDto toggleActive(Long id) {
        Vendor v = vendorRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));
        v.setActive(!v.isActive());
        v = vendorRepo.save(v);
        log.info("Toggled vendor active={}: {} (id={})", v.isActive(), v.getName(), v.getId());
        return VendorDto.fromEntity(v);
    }

    @Transactional
    public void delete(Long id) {
        vendorRepo.deleteById(id);
        log.info("Deleted vendor id={}", id);
    }
}
