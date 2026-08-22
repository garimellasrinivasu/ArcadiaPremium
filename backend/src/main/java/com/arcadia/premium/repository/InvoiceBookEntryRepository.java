package com.arcadia.premium.repository;

import com.arcadia.premium.model.InvoiceBookEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InvoiceBookEntryRepository extends JpaRepository<InvoiceBookEntry, Long> {

    List<InvoiceBookEntry> findByProjectNameOrderBySerialNumberDesc(String projectName);

    Optional<InvoiceBookEntry> findTopByProjectNameOrderBySerialNumberDesc(String projectName);

    List<InvoiceBookEntry> findByProjectNameAndInvoiceDateBetween(
            String projectName, LocalDate from, LocalDate to);

    /**
     * Lightweight projection query that selects all fields EXCEPT invoiceImageBase64.
     */
    @Query("SELECT e.id, e.projectName, e.serialNumber, e.invoiceNo, e.supplierContractorName, " +
           "e.invoiceDate, e.invoiceValue, e.materialWorkDetails, e.invoiceNarration, " +
           "e.updatedInTally, e.entryMode, e.createdBy, e.createdAt, e.updatedAt " +
           "FROM InvoiceBookEntry e WHERE e.projectName = :projectName ORDER BY e.serialNumber DESC")
    List<Object[]> findAllLightByProjectName(@Param("projectName") String projectName);

    List<InvoiceBookEntry> findAllByOrderBySerialNumberDesc();
}
