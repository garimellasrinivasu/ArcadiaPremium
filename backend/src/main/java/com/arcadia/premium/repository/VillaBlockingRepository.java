package com.arcadia.premium.repository;

import com.arcadia.premium.model.VillaBlocking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VillaBlockingRepository extends JpaRepository<VillaBlocking, Long> {

    Optional<VillaBlocking> findByVillaNumber(Integer villaNumber);

    Optional<VillaBlocking> findByProjectNameAndVillaNumber(String projectName, Integer villaNumber);

    List<VillaBlocking> findByProjectName(String projectName);

    /** Find records where projectName contains the keyword (case-insensitive) */
    @Query("SELECT v FROM VillaBlocking v WHERE LOWER(v.projectName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<VillaBlocking> findByProjectNameContaining(@Param("keyword") String keyword);

    /** Find a specific villa where projectName contains the keyword */
    @Query("SELECT v FROM VillaBlocking v WHERE LOWER(v.projectName) LIKE LOWER(CONCAT('%', :keyword, '%')) AND v.villaNumber = :villaNumber")
    Optional<VillaBlocking> findByProjectKeywordAndVillaNumber(@Param("keyword") String keyword, @Param("villaNumber") Integer villaNumber);

    /** Check if villa exists under any matching project name */
    @Query("SELECT CASE WHEN COUNT(v) > 0 THEN true ELSE false END FROM VillaBlocking v WHERE LOWER(v.projectName) LIKE LOWER(CONCAT('%', :keyword, '%')) AND v.villaNumber = :villaNumber")
    boolean existsByProjectKeywordAndVillaNumber(@Param("keyword") String keyword, @Param("villaNumber") Integer villaNumber);

    /** Bulk update old project names to new name */
    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE VillaBlocking v SET v.projectName = :newName WHERE v.projectName = :oldName")
    int updateProjectName(@Param("oldName") String oldName, @Param("newName") String newName);

    List<VillaBlocking> findAll();

    boolean existsByVillaNumber(Integer villaNumber);

    boolean existsByProjectNameAndVillaNumber(String projectName, Integer villaNumber);
}
