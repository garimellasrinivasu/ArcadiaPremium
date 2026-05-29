package com.arcadia.premium.repository;

import com.arcadia.premium.model.Contractor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractorRepository extends JpaRepository<Contractor, Long> {

    List<Contractor> findAllByOrderByNameAsc();

    List<Contractor> findByActiveTrueOrderByNameAsc();

    List<Contractor> findByContractorTypeOrderByNameAsc(String type);

    List<Contractor> findByNameContainingIgnoreCaseOrderByNameAsc(String name);
}
