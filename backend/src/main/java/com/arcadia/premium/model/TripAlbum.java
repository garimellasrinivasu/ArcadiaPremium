package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A trip memories album, shown on the public page /memories/?a={slug}.
 * Anyone with the (hard-to-guess) link can view; uploading photos needs the album PIN.
 */
@Entity
@Table(name = "trip_albums")
public class TripAlbum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Random part of the public link */
    @Column(nullable = false, unique = true, length = 32)
    private String slug;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 300)
    private String subtitle;

    /** BCrypt hash of the upload PIN */
    @Column(length = 100)
    private String uploadPinHash;

    /** Day titles and stories: {"2026-11-05": {"title": "...", "place": "...", "story": "..."}} */
    @Column(columnDefinition = "TEXT")
    private String daysJson;

    /** Trip dates: Day 1 is the start date and every day up to the end date is shown, even without photos */
    private LocalDate startDate;
    private LocalDate endDate;

    /** Photo shown at the top of the page */
    private Long coverPhotoId;

    private String createdBy;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }
    public String getUploadPinHash() { return uploadPinHash; }
    public void setUploadPinHash(String uploadPinHash) { this.uploadPinHash = uploadPinHash; }
    public String getDaysJson() { return daysJson; }
    public void setDaysJson(String daysJson) { this.daysJson = daysJson; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Long getCoverPhotoId() { return coverPhotoId; }
    public void setCoverPhotoId(Long coverPhotoId) { this.coverPhotoId = coverPhotoId; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
