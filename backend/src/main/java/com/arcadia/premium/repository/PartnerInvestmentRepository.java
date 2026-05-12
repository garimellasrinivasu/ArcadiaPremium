package com.arcadia.premium.repository;

import com.arcadia.premium.model.PartnerInvestment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PartnerInvestmentRepository extends JpaRepository<PartnerInvestment, Long> {

    List<PartnerInvestment> findAllByOrderByInvestmentDateDesc();

    List<PartnerInvestment> findByProjectNameOrderByInvestmentDateDesc(String projectName);

    List<PartnerInvestment> findByStatusOrderByInvestmentDateDesc(String status);

    List<PartnerInvestment> findByPartnerNameOrderByInvestmentDateDesc(String partnerName);

    List<PartnerInvestment> findByCreatedByEmailOrderByInvestmentDateDesc(String email);

    List<PartnerInvestment> findByStatusInOrderByInvestmentDateDesc(List<String> statuses);

    List<PartnerInvestment> findByPaymentModeAndCreatedAtBefore(String paymentMode, LocalDateTime cutoff);
}
