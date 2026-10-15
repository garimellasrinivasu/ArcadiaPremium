package com.arcadia.premium.repository;

import com.arcadia.premium.model.ChecklistPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChecklistPermissionRepository extends JpaRepository<ChecklistPermission, Long> {
    Optional<ChecklistPermission> findByUserEmailAndTrackerType(String userEmail, String trackerType);
    List<ChecklistPermission> findByUserEmail(String userEmail);
}
