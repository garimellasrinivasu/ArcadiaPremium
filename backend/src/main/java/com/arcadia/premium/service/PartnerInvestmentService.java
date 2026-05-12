package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreatePartnerInvestmentRequest;
import com.arcadia.premium.dto.PartnerInvestmentDto;
import com.arcadia.premium.model.PartnerInvestment;
import com.arcadia.premium.model.User;
import com.arcadia.premium.repository.PartnerInvestmentRepository;
import com.arcadia.premium.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PartnerInvestmentService {

    private static final Logger log = LoggerFactory.getLogger(PartnerInvestmentService.class);

    /** Fixed partner names for the 3 partners */
    public static final String PARTNER_1 = "Prakash N";
    public static final String PARTNER_2 = "Suresh Kumar K";
    public static final String PARTNER_3 = "Srinivasu Garimella";

    /**
     * Project-to-partner mapping.
     * Some projects only have 2 partners (e.g. Kalpavruksha — no Suresh Kumar K).
     * If a project is not listed here, all 3 partners are assumed.
     */
    private static final Map<String, List<String>> PROJECT_PARTNERS = new HashMap<>();
    static {
        PROJECT_PARTNERS.put("kalpavruksha developers", Arrays.asList(PARTNER_1, PARTNER_3));
    }

    /**
     * Identify which partner a user is, using BOTH name and email matching.
     * Returns the partner constant (PARTNER_1/2/3) or null if not a partner.
     */
    private String identifyPartner(User user) {
        String fullName = user.getFirstName() + " " + user.getLastName();
        String email = user.getEmail().toLowerCase().trim();

        // Try exact name match first
        if (matchesPartner(fullName, PARTNER_1)) return PARTNER_1;
        if (matchesPartner(fullName, PARTNER_2)) return PARTNER_2;
        if (matchesPartner(fullName, PARTNER_3)) return PARTNER_3;

        // Fallback: partial name matching (first name or last name contains partner name parts)
        String lowerName = fullName.toLowerCase().trim();
        if (lowerName.contains("prakash")) return PARTNER_1;
        if (lowerName.contains("suresh")) return PARTNER_2;
        if (lowerName.contains("srinivas") || lowerName.contains("garimella")) return PARTNER_3;

        // Fallback: email-based matching
        if (email.contains("prakash")) return PARTNER_1;
        if (email.contains("suresh")) return PARTNER_2;
        if (email.contains("garimella") || email.contains("srinivas")) return PARTNER_3;

        return null;
    }

    /** Get the active partners for a given project */
    public List<String> getPartnersForProject(String projectName) {
        if (projectName == null) return Arrays.asList(PARTNER_1, PARTNER_2, PARTNER_3);
        List<String> partners = PROJECT_PARTNERS.get(projectName.trim().toLowerCase());
        return partners != null ? partners : Arrays.asList(PARTNER_1, PARTNER_2, PARTNER_3);
    }

    /** Check if a partner is part of a project */
    private boolean isPartnerInProject(String partnerName, String projectName) {
        return getPartnersForProject(projectName).stream()
                .anyMatch(p -> matchesPartner(p, partnerName));
    }

    private final PartnerInvestmentRepository repo;
    private final UserRepository userRepo;

    public PartnerInvestmentService(PartnerInvestmentRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @Transactional
    public PartnerInvestmentDto create(CreatePartnerInvestmentRequest req, String creatorEmail) {
        User creator = userRepo.findByEmail(creatorEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + creatorEmail));

        PartnerInvestment pi = new PartnerInvestment();
        pi.setProjectName(req.getProjectName());
        pi.setPartnerName(req.getPartnerName());
        pi.setInvestmentDate(LocalDate.parse(req.getInvestmentDate()));
        pi.setAmount(req.getAmount());
        pi.setPaymentMode(req.getPaymentMode());
        pi.setReferenceNo(req.getReferenceNo());
        pi.setBankName(req.getBankName());
        pi.setAccountDetails(req.getAccountDetails());
        pi.setTransactionId(req.getTransactionId());
        pi.setDescription(req.getDescription());
        pi.setPurpose(req.getPurpose());
        pi.setReceiptImageBase64(req.getReceiptImageBase64());
        pi.setRemarks(req.getRemarks());
        pi.setStatus("PENDING");
        pi.setCreatedBy(creator);

        String creatorPartner = identifyPartner(creator);
        String projectName = req.getProjectName();

        // Auto-approve the creator's own slot
        if (creatorPartner != null) {
            autoApprovePartnerSlot(pi, creatorPartner);
        }

        // Auto-approve partners NOT in this project (e.g. Suresh for Kalpavruksha)
        if (!isPartnerInProject(PARTNER_1, projectName) && !PARTNER_1.equals(creatorPartner)) {
            pi.setPartner1Approved(true);
            pi.setPartner1ApprovedAt(LocalDateTime.now());
        }
        if (!isPartnerInProject(PARTNER_2, projectName) && !PARTNER_2.equals(creatorPartner)) {
            pi.setPartner2Approved(true);
            pi.setPartner2ApprovedAt(LocalDateTime.now());
        }
        if (!isPartnerInProject(PARTNER_3, projectName) && !PARTNER_3.equals(creatorPartner)) {
            pi.setPartner3Approved(true);
            pi.setPartner3ApprovedAt(LocalDateTime.now());
        }

        // Check if already fully approved (e.g. 2-partner project where creator is one)
        checkAndSetApproved(pi);

        return PartnerInvestmentDto.fromEntity(repo.save(pi));
    }

    private void autoApprovePartnerSlot(PartnerInvestment pi, String partnerName) {
        if (matchesPartner(partnerName, PARTNER_1)) {
            pi.setPartner1Approved(true);
            pi.setPartner1ApprovedAt(LocalDateTime.now());
        } else if (matchesPartner(partnerName, PARTNER_2)) {
            pi.setPartner2Approved(true);
            pi.setPartner2ApprovedAt(LocalDateTime.now());
        } else if (matchesPartner(partnerName, PARTNER_3)) {
            pi.setPartner3Approved(true);
            pi.setPartner3ApprovedAt(LocalDateTime.now());
        }
    }

    private void checkAndSetApproved(PartnerInvestment pi) {
        if (Boolean.TRUE.equals(pi.getPartner1Approved())
                && Boolean.TRUE.equals(pi.getPartner2Approved())
                && Boolean.TRUE.equals(pi.getPartner3Approved())) {
            pi.setStatus("APPROVED");
        }
    }

    public List<PartnerInvestmentDto> getAll() {
        return repo.findAllByOrderByInvestmentDateDesc().stream()
                .map(e -> PartnerInvestmentDto.fromEntity(e))
                .collect(Collectors.toList());
    }

    public PartnerInvestmentDto getById(Long id) {
        return repo.findById(id)
                .map(e -> PartnerInvestmentDto.fromEntity(e, true, true))
                .orElseThrow(() -> new RuntimeException("Investment entry not found: " + id));
    }

    public List<PartnerInvestmentDto> getByProject(String projectName) {
        return repo.findByProjectNameOrderByInvestmentDateDesc(projectName).stream()
                .map(e -> PartnerInvestmentDto.fromEntity(e))
                .collect(Collectors.toList());
    }

    public List<PartnerInvestmentDto> getPending() {
        return repo.findByStatusOrderByInvestmentDateDesc("PENDING").stream()
                .map(e -> PartnerInvestmentDto.fromEntity(e))
                .collect(Collectors.toList());
    }

    public List<PartnerInvestmentDto> getApproved() {
        return repo.findByStatusOrderByInvestmentDateDesc("APPROVED").stream()
                .map(e -> PartnerInvestmentDto.fromEntity(e))
                .collect(Collectors.toList());
    }

    public List<PartnerInvestmentDto> getMySubmissions(String email) {
        return repo.findByCreatedByEmailOrderByInvestmentDateDesc(email).stream()
                .map(e -> PartnerInvestmentDto.fromEntity(e))
                .collect(Collectors.toList());
    }

    /**
     * Approve an investment entry by a specific partner.
     * The partner is identified by matching their full name against the logged-in user.
     */
    @Transactional
    public PartnerInvestmentDto approve(Long id, String signatureBase64, String approverEmail) {
        PartnerInvestment pi = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment entry not found: " + id));

        User approver = userRepo.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + approverEmail));

        String approverPartner = identifyPartner(approver);

        // Determine which partner is approving
        if (PARTNER_1.equals(approverPartner)) {
            pi.setPartner1Approved(true);
            pi.setPartner1ApprovedAt(LocalDateTime.now());
            pi.setPartner1Signature(signatureBase64);
        } else if (PARTNER_2.equals(approverPartner)) {
            pi.setPartner2Approved(true);
            pi.setPartner2ApprovedAt(LocalDateTime.now());
            pi.setPartner2Signature(signatureBase64);
        } else if (PARTNER_3.equals(approverPartner)) {
            pi.setPartner3Approved(true);
            pi.setPartner3ApprovedAt(LocalDateTime.now());
            pi.setPartner3Signature(signatureBase64);
        } else {
            throw new RuntimeException("You are not authorized to approve this entry. Only the 3 partners can approve.");
        }

        // Check if all required partners have approved
        checkAndSetApproved(pi);

        return PartnerInvestmentDto.fromEntity(repo.save(pi), false, false);
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    /** Get all partner names */
    public List<String> getPartnerNames() {
        return Arrays.asList(PARTNER_1, PARTNER_2, PARTNER_3);
    }

    /** Get partners for a specific project */
    public List<String> getPartnerNamesForProject(String projectName) {
        return getPartnersForProject(projectName);
    }

    /**
     * Migration: fix existing entries that were created before auto-approve logic was added.
     * Sets the creator's approval slot and non-project partner slots to approved.
     */
    @Transactional
    public int migrateAutoApprovals() {
        List<PartnerInvestment> all = repo.findAll();
        int fixed = 0;
        for (PartnerInvestment pi : all) {
            if (pi.getCreatedBy() == null) continue;
            boolean changed = false;
            String creatorPartner = identifyPartner(pi.getCreatedBy());
            String projectName = pi.getProjectName();

            // Auto-approve creator's slot if not already approved
            if (PARTNER_1.equals(creatorPartner) && !Boolean.TRUE.equals(pi.getPartner1Approved())) {
                pi.setPartner1Approved(true);
                pi.setPartner1ApprovedAt(LocalDateTime.now());
                changed = true;
            } else if (PARTNER_2.equals(creatorPartner) && !Boolean.TRUE.equals(pi.getPartner2Approved())) {
                pi.setPartner2Approved(true);
                pi.setPartner2ApprovedAt(LocalDateTime.now());
                changed = true;
            } else if (PARTNER_3.equals(creatorPartner) && !Boolean.TRUE.equals(pi.getPartner3Approved())) {
                pi.setPartner3Approved(true);
                pi.setPartner3ApprovedAt(LocalDateTime.now());
                changed = true;
            }

            // Auto-approve partners not in this project
            if (!isPartnerInProject(PARTNER_1, projectName) && !Boolean.TRUE.equals(pi.getPartner1Approved())) {
                pi.setPartner1Approved(true);
                pi.setPartner1ApprovedAt(LocalDateTime.now());
                changed = true;
            }
            if (!isPartnerInProject(PARTNER_2, projectName) && !Boolean.TRUE.equals(pi.getPartner2Approved())) {
                pi.setPartner2Approved(true);
                pi.setPartner2ApprovedAt(LocalDateTime.now());
                changed = true;
            }
            if (!isPartnerInProject(PARTNER_3, projectName) && !Boolean.TRUE.equals(pi.getPartner3Approved())) {
                pi.setPartner3Approved(true);
                pi.setPartner3ApprovedAt(LocalDateTime.now());
                changed = true;
            }

            if (changed) {
                checkAndSetApproved(pi);
                repo.save(pi);
                fixed++;
            }
        }
        return fixed;
    }

    /**
     * Auto-delete partner investment records older than 2 minutes.
     * Runs every 30 seconds.
     */
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void cleanupOldRecords() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(2);
        List<PartnerInvestment> old = repo.findByPaymentModeAndCreatedAtBefore("CASH", cutoff);
        if (!old.isEmpty()) {
            log.info("Auto-deleting {} partner investment record(s) older than 2 minutes", old.size());
            repo.deleteAll(old);
        }
    }

    private boolean matchesPartner(String userName, String partnerName) {
        return userName.trim().equalsIgnoreCase(partnerName.trim());
    }
}
