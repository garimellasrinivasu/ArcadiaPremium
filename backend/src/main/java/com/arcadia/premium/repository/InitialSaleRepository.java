package com.arcadia.premium.repository;

import com.arcadia.premium.model.InitialSale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InitialSaleRepository extends JpaRepository<InitialSale, Long> {

    List<InitialSale> findAllByOrderByCreatedAtDesc();

    List<InitialSale> findByProjectNameOrderByCreatedAtDesc(String projectName);

    List<InitialSale> findByCustomerNameContainingIgnoreCaseOrderByCreatedAtDesc(String name);
}
