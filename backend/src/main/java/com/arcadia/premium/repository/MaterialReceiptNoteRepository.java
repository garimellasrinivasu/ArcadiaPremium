package com.arcadia.premium.repository;

import com.arcadia.premium.model.MaterialReceiptNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MaterialReceiptNoteRepository extends JpaRepository<MaterialReceiptNote, Long> {

    List<MaterialReceiptNote> findAllByOrderByCreatedAtDesc();

    List<MaterialReceiptNote> findByPurchaseOrderIdOrderByCreatedAtDesc(Long purchaseOrderId);

    @Query("SELECT MAX(e.mrnNumber) FROM MaterialReceiptNote e")
    Optional<String> findMaxMrnNumber();
}
