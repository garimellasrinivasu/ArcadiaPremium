package com.arcadia.premium.service;

import com.arcadia.premium.dto.ApproveAttendanceRequest;
import com.arcadia.premium.dto.ApprovalStepDto;
import com.arcadia.premium.dto.CreateSiteAttendanceRequest;
import com.arcadia.premium.dto.SiteAttendanceDto;
import com.arcadia.premium.model.*;
import com.arcadia.premium.repository.ApprovalStepRepository;
import com.arcadia.premium.repository.SiteAttendanceRepository;
import com.arcadia.premium.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SiteAttendanceService {

    private static final Logger log = LoggerFactory.getLogger(SiteAttendanceService.class);

    private final SiteAttendanceRepository attendanceRepo;
    private final ApprovalStepRepository approvalStepRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;
    private final ApprovalChainService approvalChainService;

    public SiteAttendanceService(SiteAttendanceRepository attendanceRepo,
                                  ApprovalStepRepository approvalStepRepo,
                                  UserRepository userRepo,
                                  NotificationService notificationService,
                                  ApprovalChainService approvalChainService) {
        this.attendanceRepo = attendanceRepo;
        this.approvalStepRepo = approvalStepRepo;
        this.userRepo = userRepo;
        this.notificationService = notificationService;
        this.approvalChainService = approvalChainService;
    }

    /**
     * Create a new site attendance record.
     * Auto-determines approval chain based on the submitter's role.
     */
    @Transactional
    public SiteAttendanceDto create(CreateSiteAttendanceRequest req, String submitterEmail) {
        User submitter = userRepo.findByEmail(submitterEmail)
                .orElseThrow(() -> new RuntimeException("Submitter not found"));

        SiteAttendance a = new SiteAttendance();
        a.setAttendanceDate(req.getAttendanceDate());
        a.setSiteName(req.getSiteName());
        a.setImageBase64(req.getImageBase64());
        a.setTotalWorkers(req.getTotalWorkers());
        a.setMaleCount(req.getMaleCount());
        a.setFemaleCount(req.getFemaleCount());
        a.setRemarks(req.getRemarks());
        a.setSubmittedBy(submitter);

        // Try to find an approval chain based on the submitter's roles
        Optional<ApprovalChain> chainOpt = findChainForSubmitter(submitter);

        if (chainOpt.isPresent()) {
            // Multi-level approval with specific user assignments
            ApprovalChain chain = chainOpt.get();
            a.setApprovalChain(chain);
            a.setTotalSteps(chain.getSteps().size());
            a.setCurrentStepOrder(1);
            a.setStatus("PENDING");

            // Set the first step's approver as the main approver for display
            if (!chain.getSteps().isEmpty() && chain.getSteps().get(0).getApproverUser() != null) {
                a.setApprover(chain.getSteps().get(0).getApproverUser());
            }

            a = attendanceRepo.save(a);

            // Create approval step records with specific assigned users
            for (ApprovalChainStep chainStep : chain.getSteps()) {
                User assignedUser = chainStep.getApproverUser();
                if (assignedUser == null) {
                    throw new RuntimeException("No user assigned for step " + chainStep.getStepOrder()
                            + " (" + chainStep.getApproverRoleName() + ") in chain '" + chain.getName() + "'."
                            + " Please ask admin to configure the approval chain with specific users.");
                }
                ApprovalStep step = new ApprovalStep(a, chainStep.getStepOrder(),
                        chainStep.getApproverRoleName(), assignedUser);
                approvalStepRepo.save(step);
            }

            log.info("Site attendance #{} created by {} using chain '{}' ({} steps)",
                    a.getId(), submitter.getEmail(), chain.getName(), chain.getSteps().size());

            // Auto-skip steps where the assigned approver IS the submitter
            a = autoSkipSubmitterSteps(a, submitter, chain);

            // Notify the actual next approver (after skipping)
            final SiteAttendance savedAttendance = a;
            final int actualCurrentStep = a.getCurrentStepOrder();
            if (actualCurrentStep <= a.getTotalSteps() && !"APPROVED".equals(a.getStatus())) {
                chain.getSteps().stream()
                        .filter(cs -> cs.getStepOrder() == actualCurrentStep)
                        .findFirst()
                        .ifPresent(cs -> {
                            User nextApprover = cs.getApproverUser();
                            if (nextApprover != null) {
                                String submitterName = submitter.getFirstName() + " " + submitter.getLastName();
                                notificationService.notifyApprover(nextApprover, submitterName, savedAttendance);
                                log.info("Notified {} for step {} of attendance #{}",
                                        nextApprover.getEmail(), actualCurrentStep, savedAttendance.getId());
                            }
                        });
            }

        } else if (req.getApproverId() != null) {
            // Legacy single-approver fallback
            User approver = userRepo.findById(req.getApproverId())
                    .orElseThrow(() -> new RuntimeException("Approver not found with id: " + req.getApproverId()));
            a.setApprover(approver);
            a.setStatus("PENDING");
            a.setTotalSteps(1);
            a.setCurrentStepOrder(1);
            a = attendanceRepo.save(a);

            log.info("Site attendance #{} created by {} for single approver {}",
                    a.getId(), submitter.getEmail(), approver.getEmail());

            String submitterName = submitter.getFirstName() + " " + submitter.getLastName();
            notificationService.notifyApprover(approver, submitterName, a);
        } else {
            throw new RuntimeException("No approval chain configured for your role and no approver specified. "
                    + "Please ask admin to set up an approval chain for your role.");
        }

        return toDto(a);
    }

    /**
     * Approve or reject the current step in the approval chain.
     */
    @Transactional
    public SiteAttendanceDto approve(Long id, ApproveAttendanceRequest req, String approverEmail) {
        SiteAttendance a = attendanceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found: " + id));

        if ("APPROVED".equals(a.getStatus()) || "REJECTED".equals(a.getStatus())) {
            throw new RuntimeException("Record is already " + a.getStatus());
        }

        User approver = userRepo.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("Approver not found"));

        String action = req.getAction().toUpperCase();

        if (a.getApprovalChain() != null) {
            return handleMultiLevelApproval(a, approver, action, req.getRemarks());
        } else {
            return handleLegacyApproval(a, approver, action, req.getRemarks());
        }
    }

    private SiteAttendanceDto handleMultiLevelApproval(SiteAttendance a, User approver,
                                                        String action, String remarks) {
        int currentStep = a.getCurrentStepOrder();

        ApprovalStep step = approvalStepRepo.findByAttendanceIdAndStepOrder(a.getId(), currentStep)
                .orElseThrow(() -> new RuntimeException("No pending approval step found at order " + currentStep));

        if (!"PENDING".equals(step.getStatus())) {
            throw new RuntimeException("Step " + currentStep + " is already " + step.getStatus());
        }

        // Verify the approver is the assigned user for this step
        if (step.getAssignedTo() != null) {
            boolean isAssigned = step.getAssignedTo().getId().equals(approver.getId());
            boolean isAdmin = approver.getRoles().stream().anyMatch(r -> "ADMIN".equals(r.getName()));
            if (!isAssigned && !isAdmin) {
                throw new RuntimeException("This step is assigned to "
                        + step.getAssignedTo().getFirstName() + " " + step.getAssignedTo().getLastName()
                        + ". Only they (or an admin) can approve it.");
            }
        }

        // Record the action
        step.setActedBy(approver);
        step.setStatus(action);
        step.setRemarks(remarks);
        step.setActionAt(LocalDateTime.now());
        approvalStepRepo.save(step);

        if ("REJECTED".equals(action)) {
            a.setStatus("REJECTED");
            a.setApproverRemarks(remarks);
            a.setApprovedAt(LocalDateTime.now());
            a = attendanceRepo.save(a);
            log.info("Attendance #{} REJECTED at step {} by {}", a.getId(), currentStep, approver.getEmail());

        } else if ("APPROVED".equals(action)) {
            // Find the next blocking step
            List<ApprovalChainStep> chainSteps = a.getApprovalChain().getSteps();
            ApprovalChainStep nextBlockingStep = null;
            int nextStepOrder = currentStep + 1;

            for (ApprovalChainStep cs : chainSteps) {
                if (cs.getStepOrder() > currentStep) {
                    if (cs.isBlocking()) {
                        nextBlockingStep = cs;
                        nextStepOrder = cs.getStepOrder();
                        break;
                    }
                }
            }

            if (nextBlockingStep != null) {
                a.setCurrentStepOrder(nextStepOrder);
                a.setStatus("IN_APPROVAL");
                if (nextBlockingStep.getApproverUser() != null) {
                    a.setApprover(nextBlockingStep.getApproverUser());
                }
                a = attendanceRepo.save(a);
                log.info("Attendance #{} approved at step {}, advancing to step {} ({})",
                        a.getId(), currentStep, nextStepOrder, nextBlockingStep.getApproverRoleName());

                // Auto-skip if the next approver is the submitter
                User submitter = a.getSubmittedBy();
                a = autoSkipSubmitterSteps(a, submitter, a.getApprovalChain());

                // Notify the actual next approver (after any auto-skips)
                final SiteAttendance savedA = a;
                if (!"APPROVED".equals(a.getStatus()) && !"REJECTED".equals(a.getStatus())) {
                    final int actualStep = a.getCurrentStepOrder();
                    chainSteps.stream()
                            .filter(cs -> cs.getStepOrder() == actualStep)
                            .findFirst()
                            .ifPresent(cs -> {
                                User nextApprover = cs.getApproverUser();
                                if (nextApprover != null) {
                                    String submitterName = submitter.getFirstName() + " " + submitter.getLastName();
                                    notificationService.notifyApprover(nextApprover, submitterName, savedA);
                                }
                            });
                }
            } else {
                // All blocking steps done
                a.setStatus("APPROVED");
                a.setApprovedAt(LocalDateTime.now());
                a.setApproverRemarks(remarks);
                a.setCurrentStepOrder(a.getTotalSteps() + 1);
                a = attendanceRepo.save(a);
                log.info("Attendance #{} FULLY APPROVED (all steps complete)", a.getId());
            }
        }

        return toDto(a);
    }

    private SiteAttendanceDto handleLegacyApproval(SiteAttendance a, User approver,
                                                    String action, String remarks) {
        if (a.getApprover() != null && !a.getApprover().getId().equals(approver.getId())) {
            boolean isAdmin = approver.getRoles().stream().anyMatch(r -> "ADMIN".equals(r.getName()));
            if (!isAdmin) {
                throw new RuntimeException("You are not the designated approver for this record");
            }
        }

        a.setStatus(action);
        a.setApproverRemarks(remarks);
        a.setApprovedAt(LocalDateTime.now());
        a = attendanceRepo.save(a);

        log.info("Attendance #{} {} by {} (legacy mode)", a.getId(), action, approver.getEmail());
        return toDto(a);
    }

    @Transactional(readOnly = true)
    public List<SiteAttendanceDto> getMySubmissions(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return attendanceRepo.findBySubmittedByIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toDto).toList();
    }

    /**
     * Get pending approvals for the current user.
     * Finds records where the user is the assigned approver for the current step.
     */
    @Transactional(readOnly = true)
    public List<SiteAttendanceDto> getPendingApprovals(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SiteAttendance> results = new ArrayList<>();

        // Multi-level: find by assigned user in current step
        List<ApprovalStep> assignedSteps = approvalStepRepo.findPendingStepsAssignedToUser(user.getId());
        for (ApprovalStep as : assignedSteps) {
            SiteAttendance sa = as.getAttendance();
            if (results.stream().noneMatch(r -> r.getId().equals(sa.getId()))) {
                results.add(sa);
            }
        }

        // Legacy: find by approver ID
        List<SiteAttendance> legacy = attendanceRepo
                .findByApproverIdAndStatusOrderByCreatedAtDesc(user.getId(), "PENDING");
        for (SiteAttendance sa : legacy) {
            if (sa.getApprovalChain() == null) {
                if (results.stream().noneMatch(r -> r.getId().equals(sa.getId()))) {
                    results.add(sa);
                }
            }
        }

        // Admin can see all pending
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ADMIN".equals(r.getName()));
        if (isAdmin) {
            List<SiteAttendance> allPending = attendanceRepo.findAllByOrderByCreatedAtDesc();
            for (SiteAttendance sa : allPending) {
                if (("PENDING".equals(sa.getStatus()) || "IN_APPROVAL".equals(sa.getStatus()))
                        && results.stream().noneMatch(r -> r.getId().equals(sa.getId()))) {
                    results.add(sa);
                }
            }
        }

        return results.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public long getPendingCount(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        long count = approvalStepRepo.countPendingAssignedToUser(user.getId());
        // Add legacy count
        count += attendanceRepo.countByApproverIdAndStatus(user.getId(), "PENDING");
        return count;
    }

    @Transactional(readOnly = true)
    public List<SiteAttendanceDto> getAll() {
        return attendanceRepo.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toDto).toList();
    }

    /**
     * Auto-skip (auto-approve) consecutive steps at the beginning of the chain
     * where the assigned approver is the same as the submitter.
     * E.g., if Narsimha submits and Step 1 is assigned to Narsimha, skip Step 1
     * and advance to Step 2 (Subbu).
     */
    private SiteAttendance autoSkipSubmitterSteps(SiteAttendance a, User submitter, ApprovalChain chain) {
        int currentStep = a.getCurrentStepOrder();
        List<ApprovalChainStep> chainSteps = chain.getSteps();

        while (currentStep <= a.getTotalSteps()) {
            int stepToCheck = currentStep;
            Optional<ApprovalChainStep> chainStepOpt = chainSteps.stream()
                    .filter(cs -> cs.getStepOrder() == stepToCheck)
                    .findFirst();

            if (chainStepOpt.isEmpty()) break;

            ApprovalChainStep chainStep = chainStepOpt.get();
            User assignedUser = chainStep.getApproverUser();

            // If the assigned user is NOT the submitter, stop — this is the real next approver
            if (assignedUser == null || !assignedUser.getId().equals(submitter.getId())) {
                break;
            }

            // Auto-approve this step since the submitter is the assigned approver
            Optional<ApprovalStep> stepOpt = approvalStepRepo.findByAttendanceIdAndStepOrder(a.getId(), currentStep);
            if (stepOpt.isPresent()) {
                ApprovalStep step = stepOpt.get();
                step.setStatus("APPROVED");
                step.setActedBy(submitter);
                step.setRemarks("Auto-approved (submitter is the assigned approver)");
                step.setActionAt(LocalDateTime.now());
                approvalStepRepo.save(step);
                log.info("Auto-skipped step {} for attendance #{} (assigned to submitter {})",
                        currentStep, a.getId(), submitter.getEmail());
            }

            // Move to next step
            currentStep++;

            // If this was a non-blocking step, keep going regardless
            // If blocking, we already auto-approved it, so continue checking the next step
        }

        if (currentStep > a.getTotalSteps()) {
            // All steps were auto-skipped — fully approved
            a.setStatus("APPROVED");
            a.setApprovedAt(LocalDateTime.now());
            a.setApproverRemarks("Auto-approved (all steps assigned to submitter)");
            a.setCurrentStepOrder(a.getTotalSteps() + 1);
            log.info("Attendance #{} fully auto-approved (all steps assigned to submitter)", a.getId());
        } else {
            a.setCurrentStepOrder(currentStep);
            // Update the main approver field to the actual next approver
            int nextStep = currentStep;
            chainSteps.stream()
                    .filter(cs -> cs.getStepOrder() == nextStep)
                    .findFirst()
                    .ifPresent(cs -> {
                        if (cs.getApproverUser() != null) {
                            a.setApprover(cs.getApproverUser());
                        }
                    });
            if (currentStep > 1) {
                a.setStatus("IN_APPROVAL");
            }
        }

        return attendanceRepo.save(a);
    }

    private Optional<ApprovalChain> findChainForSubmitter(User submitter) {
        for (Role role : submitter.getRoles()) {
            Optional<ApprovalChain> chain = approvalChainService.findChainForRole(role.getName());
            if (chain.isPresent()) {
                return chain;
            }
        }
        return Optional.empty();
    }

    private SiteAttendanceDto toDto(SiteAttendance a) {
        SiteAttendanceDto d = new SiteAttendanceDto();
        d.setId(a.getId());
        d.setAttendanceDate(a.getAttendanceDate());
        d.setSiteName(a.getSiteName());
        d.setImageBase64(a.getImageBase64());
        d.setTotalWorkers(a.getTotalWorkers());
        d.setMaleCount(a.getMaleCount());
        d.setFemaleCount(a.getFemaleCount());
        d.setRemarks(a.getRemarks());
        d.setStatus(a.getStatus());
        d.setSubmittedById(a.getSubmittedBy().getId());
        d.setSubmittedByName(a.getSubmittedBy().getFirstName() + " " + a.getSubmittedBy().getLastName());

        if (a.getApprover() != null) {
            d.setApproverId(a.getApprover().getId());
            d.setApproverName(a.getApprover().getFirstName() + " " + a.getApprover().getLastName());
        }
        d.setApproverRemarks(a.getApproverRemarks());
        d.setApprovedAt(a.getApprovedAt());

        if (a.getApprovalChain() != null) {
            d.setApprovalChainId(a.getApprovalChain().getId());
            d.setApprovalChainName(a.getApprovalChain().getName());
        }
        d.setCurrentStepOrder(a.getCurrentStepOrder());
        d.setTotalSteps(a.getTotalSteps());

        // Current step role name
        if (a.getApprovalChain() != null && a.getCurrentStepOrder() > 0
                && a.getCurrentStepOrder() <= a.getTotalSteps()) {
            a.getApprovalChain().getSteps().stream()
                    .filter(s -> s.getStepOrder() == a.getCurrentStepOrder())
                    .findFirst()
                    .ifPresent(s -> d.setCurrentStepRoleName(s.getApproverRoleName()));
        }

        // Approval step history with assigned user info
        List<ApprovalStep> steps = approvalStepRepo.findByAttendanceIdOrderByStepOrderAsc(a.getId());
        d.setApprovalSteps(steps.stream().map(this::toStepDto).toList());

        d.setCreatedAt(a.getCreatedAt());
        return d;
    }

    private ApprovalStepDto toStepDto(ApprovalStep step) {
        ApprovalStepDto dto = new ApprovalStepDto();
        dto.setId(step.getId());
        dto.setStepOrder(step.getStepOrder());
        dto.setApproverRoleName(step.getApproverRoleName());
        dto.setStatus(step.getStatus());
        if (step.getAssignedTo() != null) {
            dto.setAssignedToId(step.getAssignedTo().getId());
            dto.setAssignedToName(step.getAssignedTo().getFirstName() + " " + step.getAssignedTo().getLastName());
        }
        if (step.getActedBy() != null) {
            dto.setActedById(step.getActedBy().getId());
            dto.setActedByName(step.getActedBy().getFirstName() + " " + step.getActedBy().getLastName());
        }
        dto.setRemarks(step.getRemarks());
        dto.setActionAt(step.getActionAt());
        return dto;
    }
}
