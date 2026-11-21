package com.arcadia.premium.repository;

import com.arcadia.premium.model.TripAlbum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TripAlbumRepository extends JpaRepository<TripAlbum, Long> {
    Optional<TripAlbum> findBySlug(String slug);

    List<TripAlbum> findAllByOrderByCreatedAtDesc();
}
