package com.arcadia.premium.repository;

import com.arcadia.premium.model.AccountInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AccountInvoiceRepository extends JpaRepository<AccountInvoice, Long> {

    List<AccountInvoice> findByEntryId(Long entryId);

    List<AccountInvoice> findByEntryIdIn(List<Long> entryIds);

    List<AccountInvoice> findByEntryIdInAndInvoiceDateBetween(List<Long> entryIds, LocalDate start, LocalDate end);
}
