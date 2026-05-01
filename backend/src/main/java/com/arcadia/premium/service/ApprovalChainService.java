package com.arcadia.premium.service;

import com.arcadia.premium.dto.ApprovalChainDto;
import com.arcadia.premium.dto.ApprovalChainStepDto;
import com.arcadia.premium.dto.CreateApprovalChainRequest;
import com.arcadia.premium.model.ApprovalChain;
import com.arcadia.premium.model.ApprovalChainStep;
import com.arcadia.premium.model.User;
import com.arcadia.premium.repository.ApprovalChainRepository;
import com.arcadia.premium.repository.SiteAttendanceRepository;
import com.arcadia.premium.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ApprovalChainService {

    private static final Logger log = LoggerFactory.getLogger(ApprovalChainService.class);

    private final ApprovalChainRepository chainRepo;
    private final UserRepository userRepo;
    private final SiteAttendanceRepository attendanceRepo;

    public ApprovalChainService(ApprovalChainRepository chainRepo, UserRepository userRepo,
                                SiteAttendanceRepository attendanceRepo) {
        this.chainRepo = chainRepo;
        this.userRepo = userRepo;
        this.attendanceRepo = attendanceRepo;
    }

    public List<ApprovalChainDto> getAll() {
        return chainRepo.findAllByOrderBySubmitterRoleNameAscNameAsc()
                .stream().map(this::toDto).toList();
    }

    public ApprovalChainDto getById(Long id) {
        return toDto(chainRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Approval chain not found: " + id)));
    }

    /**
     * Find a valid approval chain for the given role.
     * Prefers the most recently created chain that has all steps with users assigned.
     */
    public Optional<ApprovalChain> findChainForRole(String roleName) {
        List<ApprovalChain> chains = chainRepo.findBySubmitterRoleNameAndActiveTrueOrderByIdDesc(roleName);
        for (ApprovalChain chain : chains) {
            // Only return chains where ALL steps have a specific user assigned
            boolean allStepsHaveUsers = chain.getSteps().stream()
                    .allMatch(step -> step.getApproverUser() != null);
            if (allStepsHaveUsers && !chain.getSteps().isEmpty()) {
                return Optional.of(chain);
            }
        }
        // No valid chain found (all chains have steps without users)
        return Optional.empty();
    }

    @Transactional
    public ApprovalChainDto create(CreateApprovalChainRequest req) {
        ApprovalChain chain = new ApprovalChain();
        chain.setName(req.getName());
        chain.setSubmitterRoleName(req.getSubmitterRoleName().toUpperCase());
        chain.setActive(req.isActive());

        for (int i = 0; i < req.getSteps().size(); i++) {
            CreateApprovalChainRequest.StepRequest stepReq = req.getSteps().get(i);
            User approverUser = userRepo.findById(stepReq.getApproverUserId())
                    .orElseThrow(() -> new RuntimeException("User not found: " + stepReq.getApproverUserId()));

            ApprovalChainStep step = new ApprovalChainStep(
                    chain, i + 1, stepReq.getApproverRoleName().toUpperCase(),
                    approverUser, stepReq.isBlocking());
            chain.getSteps().add(step);
        }

        chain = chainRepo.save(chain);
        log.info("Created approval chain '{}' for role {} with {} steps",
                chain.getName(), chain.getSubmitterRoleName(), chain.getSteps().size());
        return toDto(chain);
    }

    @Transactional
    public ApprovalChainDto update(Long id, CreateApprovalChainRequest req) {
        ApprovalChain chain = chainRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Approval chain not found: " + id));

        chain.setName(req.getName());
        chain.setSubmitterRoleName(req.getSubmitterRoleName().toUpperCase());
        chain.setActive(req.isActive());

        chain.getSteps().clear();
        for (int i = 0; i < req.getSteps().size(); i++) {
            CreateApprovalChainRequest.StepRequest stepReq = req.getSteps().get(i);
            User approverUser = userRepo.findById(stepReq.getApproverUserId())
                    .orElseThrow(() -> new RuntimeException("User not found: " + stepReq.getApproverUserId()));

            ApprovalChainStep step = new ApprovalChainStep(
                    chain, i + 1, stepReq.getApproverRoleName().toUpperCase(),
                    approverUser, stepReq.isBlocking());
            chain.getSteps().add(step);
        }

        chain = chainRepo.save(chain);
        log.info("Updated approval chain '{}' (id={})", chain.getName(), chain.getId());
        return toDto(chain);
    }

    @Transactional
    public void delete(Long id) {
        long usageCount = attendanceRepo.countByApprovalChainId(id);
        if (usageCount > 0) {
            throw new RuntimeException("Cannot delete this approval chain — it is used by "
                    + usageCount + " attendance record(s). Remove or reassign those records first.");
        }
        chainRepo.deleteById(id);
        log.info("Deleted approval chain id={}", id);
    }

    private ApprovalChainDto toDto(ApprovalChain chain) {
        ApprovalChainDto dto = new ApprovalChainDto();
        dto.setId(chain.getId());
        dto.setName(chain.getName());
        dto.setSubmitterRoleName(chain.getSubmitterRoleName());
        dto.setActive(chain.isActive());
        dto.setCreatedAt(chain.getCreatedAt());
        dto.setSteps(chain.getSteps().stream().map(this::toStepDto).toList());
        return dto;
    }

    private ApprovalChainStepDto toStepDto(ApprovalChainStep step) {
        ApprovalChainStepDto dto = new ApprovalChainStepDto();
        dto.setId(step.getId());
        dto.setStepOrder(step.getStepOrder());
        dto.setApproverRoleName(step.getApproverRoleName());
        dto.setBlocking(step.isBlocking());
        if (step.getApproverUser() != null) {
            dto.setApproverUserId(step.getApproverUser().getId());
            dto.setApproverUserName(step.getApproverUser().getFirstName() + " " + step.getApproverUser().getLastName());
        }
        return dto;
    }
}
