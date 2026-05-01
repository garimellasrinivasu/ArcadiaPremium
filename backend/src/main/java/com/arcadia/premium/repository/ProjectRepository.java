package com.arcadia.premium.repository;

import com.arcadia.premium.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByActiveTrueOrderByNameAsc();

    List<Project> findAllByOrderByNameAsc();

    Optional<Project> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
