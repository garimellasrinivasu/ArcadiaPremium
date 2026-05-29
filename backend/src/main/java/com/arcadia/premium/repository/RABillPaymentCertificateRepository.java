package com.arcadia.premium.repository;

import com.arcadia.premium.model.RABillPaymentCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RABillPaymentCertificateRepository extends JpaRepository<RABillPaymentCertificate, Long> {

    List<RABillPaymentCertificate> findAllByOrderByCreatedAtDesc();

    List<RABillPaymentCertificate> findByContractorIdOrderByCreatedAtDesc(Long contractorId);

    @Query("SELECT MAX(e.certificateNo) FROM RABillPaymentCertificate e")
    Optional<String> findMaxCertificateNo();
}
