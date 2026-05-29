package com.arcadia.premium.service;

import com.arcadia.premium.dto.RABillPaymentCertificateDto;
import com.arcadia.premium.model.RABillPaymentCertificate;
import com.arcadia.premium.repository.ContractorRepository;
import com.arcadia.premium.repository.RABillPaymentCertificateRepository;
import com.arcadia.premium.repository.WorkOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RABillPaymentCertificateService {

    private final RABillPaymentCertificateRepository repo;
    private final ContractorRepository contractorRepo;
    private final WorkOrderRepository woRepo;

    public RABillPaymentCertificateService(RABillPaymentCertificateRepository repo,
                                            ContractorRepository contractorRepo,
                                            WorkOrderRepository woRepo) {
        this.repo = repo;
        this.contractorRepo = contractorRepo;
        this.woRepo = woRepo;
    }

    @Transactional
    public RABillPaymentCertificateDto create(Map<String, Object> req, String createdBy) {
        RABillPaymentCertificate entity = new RABillPaymentCertificate();
        entity.setCertificateNo(generateNumber());
        Long contractorId = Long.valueOf(req.get("contractorId").toString());
        entity.setContractor(contractorRepo.findById(contractorId)
                .orElseThrow(() -> new RuntimeException("Contractor not found: " + contractorId)));
        if (req.get("workOrderId") != null) {
            Long woId = Long.valueOf(req.get("workOrderId").toString());
            entity.setWorkOrder(woRepo.findById(woId)
                    .orElseThrow(() -> new RuntimeException("WorkOrder not found: " + woId)));
        }
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

        return RABillPaymentCertificateDto.fromEntity(repo.save(entity));
    }

    public List<RABillPaymentCertificateDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(RABillPaymentCertificateDto::fromEntity).collect(Collectors.toList());
    }

    public RABillPaymentCertificateDto getById(Long id) {
        return repo.findById(id).map(RABillPaymentCertificateDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("RABillPaymentCertificate not found: " + id));
    }

    public List<RABillPaymentCertificateDto> getByContractor(Long contractorId) {
        return repo.findByContractorIdOrderByCreatedAtDesc(contractorId).stream()
                .map(RABillPaymentCertificateDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public RABillPaymentCertificateDto updateStatus(Long id, String status) {
        RABillPaymentCertificate entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("RABillPaymentCertificate not found: " + id));
        entity.setStatus(status);
        return RABillPaymentCertificateDto.fromEntity(repo.save(entity));
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }

    private String generateNumber() {
        String max = repo.findMaxCertificateNo().orElse("RPC-000");
        int num = Integer.parseInt(max.replace("RPC-", "")) + 1;
        return String.format("RPC-%03d", num);
    }
}
