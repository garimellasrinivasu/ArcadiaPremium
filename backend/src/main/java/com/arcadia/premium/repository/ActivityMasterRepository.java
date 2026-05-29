package com.arcadia.premium.repository;

import com.arcadia.premium.model.ActivityMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityMasterRepository extends JpaRepository<ActivityMaster, Long> {

    List<ActivityMaster> findAllByOrderByNameAsc();

    List<ActivityMaster> findByActivityGroupIdOrderByNameAsc(Long groupId);

    List<ActivityMaster> findByActivitySubGroupIdOrderByNameAsc(Long subGroupId);

    List<ActivityMaster> findByActiveTrueOrderByNameAsc();
}
