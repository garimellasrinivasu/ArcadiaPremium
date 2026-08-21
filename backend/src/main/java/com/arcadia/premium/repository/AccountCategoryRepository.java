package com.arcadia.premium.repository;

import com.arcadia.premium.model.AccountCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountCategoryRepository extends JpaRepository<AccountCategory, Long> {

    List<AccountCategory> findByProjectNameOrderBySortOrder(String projectName);

    boolean existsByProjectNameAndCode(String projectName, String code);

    Optional<AccountCategory> findByProjectNameAndCode(String projectName, String code);
}
