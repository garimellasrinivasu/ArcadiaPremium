package com.arcadia.premium.repository;

import com.arcadia.premium.model.ActivityGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityGroupRepository extends JpaRepository<ActivityGroup, Long> {

    List<ActivityGroup> findAllByOrderByNameAsc();

    List<ActivityGroup> findByActiveTrueOrderByNameAsc();
}
