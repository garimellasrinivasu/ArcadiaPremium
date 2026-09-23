package com.arcadia.premium.repository;

import com.arcadia.premium.model.ClusterIncharge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClusterInchargeRepository extends JpaRepository<ClusterIncharge, Long> {

    List<ClusterIncharge> findByActiveTrueOrderByClusterNumberAsc();

    List<ClusterIncharge> findAllByOrderByClusterNumberAsc();
}
