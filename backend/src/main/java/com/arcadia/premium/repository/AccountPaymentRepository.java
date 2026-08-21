package com.arcadia.premium.repository;

import com.arcadia.premium.model.AccountPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AccountPaymentRepository extends JpaRepository<AccountPayment, Long> {

    List<AccountPayment> findByEntryId(Long entryId);

    List<AccountPayment> findByEntryIdIn(List<Long> entryIds);

    List<AccountPayment> findByEntryIdInAndPaymentDateBetween(List<Long> entryIds, LocalDate start, LocalDate end);
}
