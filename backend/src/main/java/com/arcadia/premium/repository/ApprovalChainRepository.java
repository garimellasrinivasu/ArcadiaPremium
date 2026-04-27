package com.arcadia.premium.repository;

import com.arcadia.premium.model.ApprovalChain;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApprovalChainRepository extends JpaRepository<ApprovalChain, Long> {

    List<ApprovalChain> findBySubmitterRoleNameAndActiveTrue(String submitterRoleName);

    /**
     * Find active chains for a role, ordered by most recently created first.
     */
    List<ApprovalChain> findBySubmitterRoleNameAndActiveTrueOrderByIdDesc(String submitterRoleName);

    List<ApprovalChain> findAllByOrderBySubmitterRoleNameAscNameAsc();
}
