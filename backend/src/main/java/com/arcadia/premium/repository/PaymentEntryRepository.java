package com.arcadia.premium.repository;

import com.arcadia.premium.model.PaymentEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentEntryRepository extends JpaRepository<PaymentEntry, Long> {

    List<PaymentEntry> findBySaleEntryIdOrderByPaymentDateAsc(Long saleEntryId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentEntry p WHERE p.saleEntry.id = :saleEntryId")
    BigDecimal sumBySaleEntryId(@Param("saleEntryId") Long saleEntryId);
}
