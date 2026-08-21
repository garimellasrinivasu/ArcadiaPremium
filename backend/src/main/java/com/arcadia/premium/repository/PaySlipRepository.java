package com.arcadia.premium.repository;

import com.arcadia.premium.model.PaySlip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaySlipRepository extends JpaRepository<PaySlip, Long> {

    List<PaySlip> findByPayMonthOrderByCreatedAtDesc(String payMonth);

    List<PaySlip> findByEmployeeIdOrderByPayMonthDesc(String employeeId);

    List<PaySlip> findAllByOrderByCreatedAtDesc();
}
