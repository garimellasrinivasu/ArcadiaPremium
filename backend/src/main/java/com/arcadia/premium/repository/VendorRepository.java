package com.arcadia.premium.repository;

import com.arcadia.premium.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {

    List<Vendor> findAllByOrderByNameAsc();

    List<Vendor> findByActiveTrueOrderByNameAsc();

    List<Vendor> findByNameContainingIgnoreCaseOrderByNameAsc(String name);
}
