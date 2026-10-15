package com.arcadia.premium.repository;

import com.arcadia.premium.model.ChecklistFolder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ChecklistFolderRepository extends JpaRepository<ChecklistFolder, Long> {
    List<ChecklistFolder> findByItemIdInOrderByNameAsc(Collection<Long> itemIds);
    List<ChecklistFolder> findByItemId(Long itemId);
    void deleteByItemId(Long itemId);
}
