package com.arcadia.premium.repository;

import com.arcadia.premium.model.ShowcaseVisit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ShowcaseVisitRepository extends JpaRepository<ShowcaseVisit, Long> {
    boolean existsByPageAndVisitorIdAndVisitedAtAfter(String page, String visitorId, LocalDateTime after);

    List<ShowcaseVisit> findAllByOrderByVisitedAtDesc();
}
