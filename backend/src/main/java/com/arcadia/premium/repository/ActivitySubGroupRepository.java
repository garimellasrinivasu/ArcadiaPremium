package com.arcadia.premium.repository;

import com.arcadia.premium.model.ActivitySubGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivitySubGroupRepository extends JpaRepository<ActivitySubGroup, Long> {

    List<ActivitySubGroup> findAllByOrderByNameAsc();

    List<ActivitySubGroup> findByActivityGroupIdOrderByNameAsc(Long groupId);

    List<ActivitySubGroup> findByActiveTrueOrderByNameAsc();
}
