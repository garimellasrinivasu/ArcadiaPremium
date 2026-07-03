package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreatePujaExpenseRequest;
import com.arcadia.premium.dto.PujaExpenseDto;
import com.arcadia.premium.model.PujaExpense;
import com.arcadia.premium.repository.PujaExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PujaExpenseService {

    private final PujaExpenseRepository repository;

    public PujaExpenseService(PujaExpenseRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public PujaExpenseDto create(CreatePujaExpenseRequest req, String createdBy) {
        PujaExpense entity = new PujaExpense();
        entity.setPujaName(req.getPujaName() != null ? req.getPujaName() : "Shankustaphana Puja");
        entity.setPujaDate(req.getPujaDate());
        entity.setCategory(req.getCategory());
        entity.setDescription(req.getDescription());
        entity.setVendor(req.getVendor());
        entity.setAmount(req.getAmount());
        entity.setPaymentStatus(req.getPaymentStatus() != null ? req.getPaymentStatus() : "Paid");
        entity.setPaidBy(req.getPaidBy());
        entity.setPaymentMode(req.getPaymentMode() != null ? req.getPaymentMode() : "Cash");
        entity.setReceiptNo(req.getReceiptNo());
        entity.setPayeeName(req.getPayeeName());
        entity.setProjectName(req.getProjectName());
        entity.setNotes(req.getNotes());
        entity.setPreparedBy(req.getPreparedBy());
        entity.setCreatedBy(createdBy);
        return PujaExpenseDto.fromEntity(repository.save(entity));
    }

    public List<PujaExpenseDto> getAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(PujaExpenseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<PujaExpenseDto> getByPujaName(String pujaName) {
        return repository.findByPujaNameOrderByCreatedAtDesc(pujaName).stream()
                .map(PujaExpenseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<PujaExpenseDto> getByProject(String projectName) {
        return repository.findByProjectNameOrderByCreatedAtDesc(projectName).stream()
                .map(PujaExpenseDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public PujaExpenseDto update(Long id, CreatePujaExpenseRequest req) {
        PujaExpense entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Puja expense not found: " + id));
        if (req.getPujaName() != null) entity.setPujaName(req.getPujaName());
        entity.setPujaDate(req.getPujaDate());
        entity.setCategory(req.getCategory());
        entity.setDescription(req.getDescription());
        entity.setVendor(req.getVendor());
        entity.setAmount(req.getAmount());
        entity.setPaymentStatus(req.getPaymentStatus() != null ? req.getPaymentStatus() : "Paid");
        entity.setPaidBy(req.getPaidBy());
        if (req.getPaymentMode() != null) entity.setPaymentMode(req.getPaymentMode());
        entity.setReceiptNo(req.getReceiptNo());
        entity.setPayeeName(req.getPayeeName());
        entity.setProjectName(req.getProjectName());
        entity.setNotes(req.getNotes());
        entity.setPreparedBy(req.getPreparedBy());
        return PujaExpenseDto.fromEntity(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
