package com.arcadia.premium.service;

import com.arcadia.premium.dto.POPaymentCertificateDto;
import com.arcadia.premium.model.POPaymentCertificate;
import com.arcadia.premium.repository.POPaymentCertificateRepository;
import com.arcadia.premium.repository.VendorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class POPaymentCertificateService {

    private final POPaymentCertificateRepository repo;
    private final VendorRepository vendorRepo;

    public POPaymentCertificateService(POPaymentCertificateRepository repo, VendorRepository vendorRepo) {
        this.repo = repo;
        this.vendorRepo = vendorRepo;
    }

    @Transactional
    public POPaymentCertificateDto create(Map<String, Object> req, String createdBy) {
        POPaymentCertificate entity = new POPaymentCertificate();
        entity.setCertificateNo(generateNumber());
        Long vendorId = Long.valueOf(req.get("vendorId").toString());
        entity.setVendor(vendorRepo.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + vendorId)));
        entity.setPaymentDate(LocalDate.parse(req.get("paymentDate").toString()));
        entity.setPaymentMode((String) req.get("paymentMode"));
        entity.setBankName((String) req.get("bankName"));
        entity.setChequeNo((String) req.get("chequeNo"));
        if (req.get("chequeDate") != null) {
            entity.setChequeDate(LocalDate.parse(req.get("chequeDate").toString()));
        }
        entity.setTotalAmount(new BigDecimal(req.get("totalAmount").toString()));
        entity.setRemarks((String) req.get("remarks"));
        entity.setCreatedBy(createdBy);

        return POPaymentCertificateDto.fromEntity(repo.save(entity));
    }

    public List<POPaymentCertificateDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(POPaymentCertificateDto::fromEntity).collect(Collectors.toList());
    }

    public POPaymentCertificateDto getById(Long id) {
        return repo.findById(id).map(POPaymentCertificateDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("POPaymentCertificate not found: " + id));
    }

    public List<POPaymentCertificateDto> getByVendor(Long vendorId) {
        return repo.findByVendorIdOrderByCreatedAtDesc(vendorId).stream()
                .map(POPaymentCertificateDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public POPaymentCertificateDto updateStatus(Long id, String status) {
        POPaymentCertificate entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("POPaymentCertificate not found: " + id));
        entity.setStatus(status);
        return POPaymentCertificateDto.fromEntity(repo.save(entity));
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }

    private String generateNumber() {
        String max = repo.findMaxCertificateNo().orElse("PPC-000");
        int num = Integer.parseInt(max.replace("PPC-", "")) + 1;
        return String.format("PPC-%03d", num);
    }
}
