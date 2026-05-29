package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateFinanceSpentRequest;
import com.arcadia.premium.dto.FinanceSpentDto;
import com.arcadia.premium.model.FinanceSpent;
import com.arcadia.premium.model.User;
import com.arcadia.premium.repository.FinanceSpentRepository;
import com.arcadia.premium.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FinanceSpentService {

    private static final Logger log = LoggerFactory.getLogger(FinanceSpentService.class);

    private final FinanceSpentRepository repo;
    private final UserRepository userRepo;

    public FinanceSpentService(FinanceSpentRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    /** On startup, backfill request numbers for any old entries that don't have one */
    @PostConstruct
    @Transactional
    public void backfillRequestNumbers() {
        List<FinanceSpent> noReqNum = repo.findAll().stream()
                .filter(f -> f.getRequestNumber() == null || f.getRequestNumber().isBlank())
                .collect(Collectors.toList());
        if (!noReqNum.isEmpty()) {
            log.info("Backfilling request numbers for {} finance entries", noReqNum.size());
            for (FinanceSpent fs : noReqNum) {
                fs.setRequestNumber(generateRequestNumber());
                repo.save(fs);
            }
            log.info("Backfill complete");
        }
    }

    /** Generate next request number like FIN-2026-0001 */
    private String generateRequestNumber() {
        int year = Year.now().getValue();
        String prefix = "FIN-" + year + "-";
        long count = repo.countByRequestNumberPrefix(prefix + "%");
        return prefix + String.format("%04d", count + 1);
    }

    /**
     * STAGE 1: Create a payment request (no receipt yet).
     * Status = PENDING_APPROVAL
     */
    @Transactional
    public FinanceSpentDto createRequest(CreateFinanceSpentRequest req, String submitterEmail) {
        User submitter = userRepo.findByEmail(submitterEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + submitterEmail));

        FinanceSpent fs = new FinanceSpent();
        fs.setRequestNumber(generateRequestNumber());
        fs.setProjectName(req.getProjectName());
        fs.setSpentDate(LocalDate.parse(req.getSpentDate()));
        fs.setAmount(req.getAmount());
        fs.setPaidBy(req.getPaidBy());
        fs.setPaidTo(req.getPaidTo());
        fs.setVendorAcknowledgement(req.getVendorAcknowledgement() != null ? req.getVendorAcknowledgement() : "PENDING");
        fs.setDescription(req.getDescription());
        fs.setRemarks(req.getRemarks());
        fs.setStatus("PENDING_APPROVAL");
        fs.setSubmittedBy(submitter);
        // No receipt at request stage

        return FinanceSpentDto.fromEntity(repo.save(fs));
    }

    /**
     * Legacy create (kept for backward compatibility).
     * Maps to createRequest.
     */
    @Transactional
    public FinanceSpentDto create(CreateFinanceSpentRequest req, String submitterEmail) {
        return createRequest(req, submitterEmail);
    }

    public List<FinanceSpentDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
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

    /** User's own requests (all statuses) */
    public List<FinanceSpentDto> getMySubmissions(String email) {
        return repo.findBySubmittedByEmailOrderByCreatedAtDesc(email).stream()
                .map(e -> FinanceSpentDto.fromEntity(e, false))
                .collect(Collectors.toList());
    }

    /** STAGE 2: Pending approval requests for authority */
    public List<FinanceSpentDto> getPendingApprovals() {
        return repo.findByStatusOrderByCreatedAtDesc("PENDING_APPROVAL").stream()
                .map(e -> FinanceSpentDto.fromEntity(e, false))
                .collect(Collectors.toList());
    }

    /** STAGE 3: Approved requests ready for payment.
     *  Shows the user's own approved requests.
     *  Admin/Partner can see all approved requests.
     */
    public List<FinanceSpentDto> getApprovedForPayment(String email) {
        User user = userRepo.findByEmail(email).orElse(null);
        boolean isAdmin = user != null && user.getRole() != null
                && ("ADMIN".equals(user.getRole().getName()) || "PARTNER".equals(user.getRole().getName()));

        return repo.findByStatusOrderByCreatedAtDesc("APPROVED").stream()
                .filter(e -> isAdmin || e.getSubmittedBy().getEmail().equals(email))
                .map(e -> FinanceSpentDto.fromEntity(e, false))
                .collect(Collectors.toList());
    }

    /**
     * STAGE 2: Authority approves or rejects.
     */
    @Transactional
    public FinanceSpentDto approve(Long id, String action, String remarks, String approverEmail) {
        FinanceSpent fs = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Finance entry not found: " + id));

        if (!"PENDING_APPROVAL".equals(fs.getStatus())) {
            throw new RuntimeException("Only PENDING_APPROVAL entries can be approved/rejected. Current status: " + fs.getStatus());
        }

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

    /**
     * STAGE 3: User marks payment as done.
     * Uploads receipt, sets payment date, changes status to PAID.
     */
    @Transactional
    public FinanceSpentDto markPaid(Long id, String receiptImageBase64, String paymentDate,
                                    String paymentRemarks, String vendorAcknowledgement, String userEmail) {
        FinanceSpent fs = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Finance entry not found: " + id));

        if (!"APPROVED".equals(fs.getStatus())) {
            throw new RuntimeException("Only APPROVED entries can be marked as paid. Current status: " + fs.getStatus());
        }

        // Verify the requester is the original submitter OR an admin/partner
        User currentUser = userRepo.findByEmail(userEmail).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null
                && ("ADMIN".equals(currentUser.getRole().getName()) || "PARTNER".equals(currentUser.getRole().getName()));
        if (!isAdmin && !fs.getSubmittedBy().getEmail().equals(userEmail)) {
            throw new RuntimeException("Only the original requester or admin can mark this as paid.");
        }

        fs.setStatus("PAID");
        fs.setReceiptImageBase64(receiptImageBase64);
        fs.setPaymentDate(paymentDate != null ? LocalDate.parse(paymentDate) : LocalDate.now());
        fs.setPaymentRemarks(paymentRemarks);
        if (vendorAcknowledgement != null) {
            fs.setVendorAcknowledgement(vendorAcknowledgement);
        }

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
