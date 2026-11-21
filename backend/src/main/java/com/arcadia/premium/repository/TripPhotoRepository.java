package com.arcadia.premium.repository;

import com.arcadia.premium.model.TripPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TripPhotoRepository extends JpaRepository<TripPhoto, Long> {
    List<TripPhoto> findByAlbumIdOrderByCapturedAtAscIdAsc(Long albumId);

    Optional<TripPhoto> findFirstByAlbumIdAndFingerprint(Long albumId, String fingerprint);

    long countByAlbumId(Long albumId);

    List<TripPhoto> findByStatus(String status);
}
