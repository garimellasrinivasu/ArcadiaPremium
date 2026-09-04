package com.arcadia.premium.repository;

import com.arcadia.premium.model.MastriLeader;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MastriLeaderRepository extends JpaRepository<MastriLeader, Long> {

    List<MastriLeader> findByActiveTrueOrderByNameAsc();

    List<MastriLeader> findAllByOrderByNameAsc();
}
