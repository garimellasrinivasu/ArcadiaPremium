package com.arcadia.premium.service;

import com.arcadia.premium.dto.MaterialRateDto;
import com.arcadia.premium.model.MaterialMaster;
import com.arcadia.premium.model.MaterialRate;
import com.arcadia.premium.model.Vendor;
import com.arcadia.premium.repository.MaterialMasterRepository;
import com.arcadia.premium.repository.MaterialRateRepository;
import com.arcadia.premium.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialRateService {

    private static final Logger log = LoggerFactory.getLogger(MaterialRateService.class);

    private final MaterialRateRepository repo;
    private final VendorRepository vendorRepo;
    private final MaterialMasterRepository materialRepo;

    public MaterialRateService(MaterialRateRepository repo,
                               VendorRepository vendorRepo,
                               MaterialMasterRepository materialRepo) {
        this.repo = repo;
        this.vendorRepo = vendorRepo;
        this.materialRepo = materialRepo;
    }

    @Transactional
    public MaterialRateDto addRate(Long vendorId, Long materialId, BigDecimal rate, LocalDate rateDate,
                                   Double taxPercent, String taxType, String remarks, String createdBy) {
        Vendor vendor = vendorRepo.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + vendorId));
        MaterialMaster material = materialRepo.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found with id: " + materialId));

        MaterialRate mr = new MaterialRate();
        mr.setVendor(vendor);
        mr.setMaterial(material);
        mr.setRate(rate);
        mr.setRateDate(rateDate);
        mr.setTaxPercent(taxPercent);
        mr.setTaxType(taxType);
        mr.setRemarks(remarks);
        mr.setStatus("DRAFT");
        mr.setSubmittedBy(createdBy);
        mr.setCreatedBy(createdBy);
        mr = repo.save(mr);
        log.info("Added material rate: vendor={} material={} rate={} (id={})", vendorId, materialId, rate, mr.getId());
        return MaterialRateDto.fromEntity(mr);
    }

    public List<MaterialRateDto> getByVendorAndMaterial(Long vendorId, Long materialId) {
        return repo.findByVendorIdAndMaterialIdOrderByRateDateDesc(vendorId, materialId).stream()
                .map(MaterialRateDto::fromEntity).collect(Collectors.toList());
    }

    public List<MaterialRateDto> getByVendor(Long vendorId) {
        return repo.findByVendorIdOrderByRateDateDesc(vendorId).stream()
                .map(MaterialRateDto::fromEntity).collect(Collectors.toList());
    }

    public MaterialRateDto getLatestApprovedRate(Long materialId) {
        List<MaterialRate> rates = repo.findByMaterialIdAndApprovedTrueOrderByRateDateDesc(materialId);
        if (rates.isEmpty()) {
            return null;
        }
        return MaterialRateDto.fromEntity(rates.get(0));
    }

    @Transactional
    public MaterialRateDto approveRate(Long id, String approverName) {
        MaterialRate mr = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MaterialRate not found with id: " + id));
        mr.setApproved(true);
        mr.setStatus("APPROVED");
        mr.setApprovedBy(approverName);
        mr.setApprovedDate(LocalDate.now());
        mr = repo.save(mr);
        log.info("Approved material rate id={} by {}", id, approverName);
        return MaterialRateDto.fromEntity(mr);
    }

    public List<MaterialRateDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(MaterialRateDto::fromEntity).collect(Collectors.toList());
    }

    public List<MaterialRateDto> getByMaterial(Long materialId) {
        return repo.findByMaterialIdOrderByRateDateDesc(materialId).stream()
                .map(MaterialRateDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public MaterialRateDto submitRate(Long id, String submitterName) {
        MaterialRate mr = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MaterialRate not found with id: " + id));
        mr.setStatus("SUBMITTED");
        mr.setSubmittedBy(submitterName);
        mr = repo.save(mr);
        log.info("Submitted material rate id={} by {}", id, submitterName);
        return MaterialRateDto.fromEntity(mr);
    }

    @Transactional
    public MaterialRateDto rejectRate(Long id, String rejectorName, String reason) {
        MaterialRate mr = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MaterialRate not found with id: " + id));
        mr.setStatus("REJECTED");
        mr.setRejectionReason(reason);
        mr = repo.save(mr);
        log.info("Rejected material rate id={} by {} reason={}", id, rejectorName, reason);
        return MaterialRateDto.fromEntity(mr);
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
        log.info("Deleted material rate id={}", id);
    }
}
