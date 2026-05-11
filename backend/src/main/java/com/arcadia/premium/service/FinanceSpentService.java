package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateFinanceSpentRequest;
import com.arcadia.premium.dto.FinanceSpentDto;
import com.arcadia.premium.model.FinanceSpent;
import com.arcadia.premium.model.User;
import com.arcadia.premium.repository.FinanceSpentRepository;
import com.arcadia.premium.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FinanceSpentService {

    private final FinanceSpentRepository repo;
    private final UserRepository userRepo;

    public FinanceSpentService(FinanceSpentRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @Transactional
    public FinanceSpentDto create(CreateFinanceSpentRequest req, String submitterEmail) {
        User submitter = userRepo.findByEmail(submitterEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + submitterEmail));

        FinanceSpent fs = new FinanceSpent();
        fs.setProjectName(req.getProjectName());
        fs.setSpentDate(LocalDate.parse(req.getSpentDate()));
        fs.setAmount(req.getAmount());
        fs.setPaidBy(req.getPaidBy());
        fs.setPaidTo(req.getPaidTo());
        fs.setVendorAcknowledgement(req.getVendorAcknowledgement());
        fs.setReceiptImageBase64(req.getReceiptImageBase64());
        fs.setDescription(req.getDescription());
        fs.setRemarks(req.getRemarks());
        fs.setStatus("PENDING");
        fs.setSubmittedBy(submitter);

        return FinanceSpentDto.fromEntity(repo.save(fs));
    }

    public List<FinanceSpentDto> getAll() {
        return repo.findAllByOrderBySpentDateDesc().stream()
                .map(e -> FinanceSpentDto.fromEntity(e, false))
                .collect(Collectors.toList());
    }

    public FinanceSpentDto getById(Long id) {
        return repo.findById(id)
                .map(FinanceSpentDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Finance entry not found: " + id));
    }

    public List<FinanceSpentDto> getByDateRange(LocalDate from, LocalDate to, String projectName) {
        List<FinanceSpent> list;
        if (projectName != null && !projectName.isBlank()) {
            list = repo.findByProjectNameAndSpentDateBetweenOrderBySpentDateDesc(projectName, from, to);
        } else {
            list = repo.findBySpentDateBetweenOrderBySpentDateDesc(from, to);
        }
        return list.stream()
                .map(e -> FinanceSpentDto.fromEntity(e, false))
                .collect(Collectors.toList());
    }

    public List<FinanceSpentDto> getMySubmissions(String email) {
        return repo.findBySubmittedByEmailOrderBySpentDateDesc(email).stream()
                .map(e -> FinanceSpentDto.fromEntity(e, false))
                .collect(Collectors.toList());
    }

    public List<FinanceSpentDto> getPendingApprovals() {
        return repo.findByStatusOrderBySpentDateDesc("PENDING").stream()
                .map(e -> FinanceSpentDto.fromEntity(e, false))
                .collect(Collectors.toList());
    }

    @Transactional
    public FinanceSpentDto approve(Long id, String action, String remarks, String approverEmail) {
        FinanceSpent fs = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Finance entry not found: " + id));

        User approver = userRepo.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + approverEmail));

        if ("APPROVED".equals(action)) {
            fs.setStatus("APPROVED");
        } else if ("REJECTED".equals(action)) {
            fs.setStatus("REJECTED");
        } else {
            throw new RuntimeException("Invalid action: " + action);
        }

        fs.setApprovedBy(approver);
        fs.setApproverRemarks(remarks);
        fs.setApprovedAt(LocalDateTime.now());

        return FinanceSpentDto.fromEntity(repo.save(fs));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    public List<String> getDistinctPaidBy() {
        return repo.findDistinctPaidBy();
    }

    public List<String> getDistinctPaidTo() {
        return repo.findDistinctPaidTo();
    }

    public List<String> getDistinctDescriptions() {
        return repo.findDistinctDescriptions();
    }

    /** Lightweight user name list for dropdowns (all active users) */
    public List<Map<String, Object>> getUserNames() {
        return userRepo.findAll().stream()
                .filter(u -> u.isActive())
                .map(u -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("name", u.getFirstName() + " " + u.getLastName());
                    return m;
                })
                .collect(Collectors.toList());
    }
}
