package com.arcadia.premium.repository;

import com.arcadia.premium.model.SaleQuote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SaleQuoteRepository extends JpaRepository<SaleQuote, Long> {

    List<SaleQuote> findByQuoteDateBetweenOrderByQuoteDateDesc(LocalDate from, LocalDate to);

    List<SaleQuote> findByQuoteDateOrderByCreatedAtDesc(LocalDate date);

    List<SaleQuote> findByCustomerNameContainingIgnoreCaseOrderByQuoteDateDesc(String name);

    List<SaleQuote> findByPlotNoContainingIgnoreCaseOrderByQuoteDateDesc(String plotNo);

    List<SaleQuote> findAllByOrderByQuoteDateDesc();

    @Query("SELECT q FROM SaleQuote q WHERE " +
           "(:search IS NULL OR LOWER(q.customerName) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(q.plotNo) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(q.customerPhone) LIKE LOWER(CONCAT('%',:search,'%'))) " +
           "AND (:from IS NULL OR q.quoteDate >= :from) " +
           "AND (:to IS NULL OR q.quoteDate <= :to) " +
           "ORDER BY q.quoteDate DESC")
    List<SaleQuote> searchQuotes(@Param("search") String search,
                                 @Param("from") LocalDate from,
                                 @Param("to") LocalDate to);
}
