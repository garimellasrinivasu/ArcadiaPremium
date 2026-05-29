package com.arcadia.premium.repository;

import com.arcadia.premium.model.GoodsReceiptNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface GoodsReceiptNoteRepository extends JpaRepository<GoodsReceiptNote, Long> {

    List<GoodsReceiptNote> findAllByOrderByCreatedAtDesc();

    List<GoodsReceiptNote> findByMrnIdOrderByCreatedAtDesc(Long mrnId);

    @Query("SELECT MAX(e.grnNumber) FROM GoodsReceiptNote e")
    Optional<String> findMaxGrnNumber();
}
