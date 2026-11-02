package com.arcadia.premium.repository;

import com.arcadia.premium.model.DiwaliGift;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiwaliGiftRepository extends JpaRepository<DiwaliGift, Long> {
    List<DiwaliGift> findByFestivalYearOrderByRecipientNameAsc(Integer festivalYear);

    @org.springframework.data.jpa.repository.Query("select distinct g.festivalYear from DiwaliGift g order by g.festivalYear desc")
    List<Integer> findYears();
}
