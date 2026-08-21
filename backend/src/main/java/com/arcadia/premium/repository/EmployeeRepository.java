package com.arcadia.premium.repository;

import com.arcadia.premium.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmployeeId(String employeeId);

    List<Employee> findByActiveTrue();

    List<Employee> findByActiveTrueOrderByNameAsc();
}
