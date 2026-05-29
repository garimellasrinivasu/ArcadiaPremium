package com.arcadia.premium.repository;

import com.arcadia.premium.model.POPaymentCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface POPaymentCertificateRepository extends JpaRepository<POPaymentCertificate, Long> {

    List<POPaymentCertificate> findAllByOrderByCreatedAtDesc();

    List<POPaymentCertificate> findByVendorIdOrderByCreatedAtDesc(Long vendorId);

    @Query("SELECT MAX(e.certificateNo) FROM POPaymentCertificate e")
    Optional<String> findMaxCertificateNo();
}
