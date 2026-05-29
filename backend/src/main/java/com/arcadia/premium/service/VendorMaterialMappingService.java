package com.arcadia.premium.service;

import com.arcadia.premium.dto.VendorMaterialMappingDto;
import com.arcadia.premium.model.MaterialMaster;
import com.arcadia.premium.model.Vendor;
import com.arcadia.premium.model.VendorMaterialMapping;
import com.arcadia.premium.repository.MaterialMasterRepository;
import com.arcadia.premium.repository.VendorMaterialMappingRepository;
import com.arcadia.premium.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VendorMaterialMappingService {

    private static final Logger log = LoggerFactory.getLogger(VendorMaterialMappingService.class);

    private final VendorMaterialMappingRepository repo;
    private final VendorRepository vendorRepo;
    private final MaterialMasterRepository materialRepo;

    public VendorMaterialMappingService(VendorMaterialMappingRepository repo,
                                        VendorRepository vendorRepo,
                                        MaterialMasterRepository materialRepo) {
        this.repo = repo;
        this.vendorRepo = vendorRepo;
        this.materialRepo = materialRepo;
    }

    @Transactional
    public VendorMaterialMappingDto create(Long vendorId, Long materialId) {
        // Check if mapping already exists
        repo.findByVendorIdAndMaterialId(vendorId, materialId).ifPresent(existing -> {
            throw new RuntimeException("Mapping already exists for vendor=" + vendorId + " material=" + materialId);
        });

        Vendor vendor = vendorRepo.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + vendorId));
        MaterialMaster material = materialRepo.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found with id: " + materialId));

        VendorMaterialMapping mapping = new VendorMaterialMapping();
        mapping.setVendor(vendor);
        mapping.setMaterial(material);
        mapping.setActive(true);
        mapping = repo.save(mapping);
        log.info("Created vendor-material mapping: vendor={} material={} (id={})", vendorId, materialId, mapping.getId());
        return VendorMaterialMappingDto.fromEntity(mapping);
    }

    public List<VendorMaterialMappingDto> getByVendor(Long vendorId) {
        return repo.findByVendorIdOrderByIdAsc(vendorId).stream()
                .map(VendorMaterialMappingDto::fromEntity).collect(Collectors.toList());
    }

    public List<VendorMaterialMappingDto> getByMaterial(Long materialId) {
        return repo.findByMaterialIdOrderByIdAsc(materialId).stream()
                .map(VendorMaterialMappingDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
        log.info("Deleted vendor-material mapping id={}", id);
    }
}
