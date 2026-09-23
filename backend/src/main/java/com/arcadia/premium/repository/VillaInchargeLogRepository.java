package com.arcadia.premium.repository;

import com.arcadia.premium.model.VillaInchargeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VillaInchargeLogRepository extends JpaRepository<VillaInchargeLog, Long> {

    List<VillaInchargeLog> findByProjectNameAndVillaNumberOrderByChangedAtDesc(
            String projectName, Integer villaNumber);

    List<VillaInchargeLog> findByProjectNameOrderByChangedAtDesc(String projectName);
}
