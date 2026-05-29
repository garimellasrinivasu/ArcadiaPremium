package com.arcadia.premium.repository;

import com.arcadia.premium.model.MeasurementBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MeasurementBookRepository extends JpaRepository<MeasurementBook, Long> {

    List<MeasurementBook> findAllByOrderByCreatedAtDesc();

    List<MeasurementBook> findByWorkOrderIdOrderByCreatedAtDesc(Long workOrderId);

    @Query("SELECT MAX(e.mbNumber) FROM MeasurementBook e")
    Optional<String> findMaxMbNumber();
}
