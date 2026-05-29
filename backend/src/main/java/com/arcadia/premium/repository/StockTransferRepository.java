package com.arcadia.premium.repository;

import com.arcadia.premium.model.StockTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {

    List<StockTransfer> findAllByOrderByCreatedAtDesc();

    List<StockTransfer> findByFromProjectIdOrderByCreatedAtDesc(Long fromProjectId);

    @Query("SELECT MAX(e.transferNo) FROM StockTransfer e")
    Optional<String> findMaxTransferNo();
}
