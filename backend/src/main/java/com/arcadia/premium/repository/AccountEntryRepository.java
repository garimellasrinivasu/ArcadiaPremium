package com.arcadia.premium.repository;

import com.arcadia.premium.model.AccountEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountEntryRepository extends JpaRepository<AccountEntry, Long> {

    List<AccountEntry> findByProjectName(String projectName);

    List<AccountEntry> findByCategoryId(Long categoryId);

    List<AccountEntry> findByProjectNameAndCategoryId(String projectName, Long categoryId);
}
