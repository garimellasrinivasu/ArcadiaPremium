package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * One photo or video in a trip album. Files are on disk (image, thumbnail and, for a video or a Live Photo,
 * an MP4 clip); this row holds the details.
 */
@Entity
@Table(name = "trip_photos", indexes = {
        @Index(name = "idx_trip_photo_album", columnList = "albumId, capturedAt"),
        @Index(name = "idx_trip_photo_fingerprint", columnList = "albumId, fingerprint")
})
public class TripPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long albumId;

    /** File names inside the album folder */
    @Column(nullable = false, length = 80)
    private String fileName;
    @Column(nullable = false, length = 80)
    private String thumbName;

    private Integer width;
    private Integer height;
    private Long sizeBytes;

    /** When the photo was taken, local time at the place (from the photo's own details) */
    private LocalDateTime capturedAt;

    /** True when the photo had no capture date and the upload date was used instead */
    private Boolean dateGuessed;

    private Double latitude;
    private Double longitude;

    /** Friend who uploaded it */
    @Column(length = 60)
    private String uploadedBy;

    @Column(length = 300)
    private String caption;

    /** Shown larger on the page */
    private Boolean highlight;

    /** Hidden from the public page (kept, can be shown again) */
    private Boolean hidden;

    /** Original file name + size + capture time, so the same photo isn't added twice */
    @Column(length = 200)
    private String fingerprint;

    private LocalDateTime uploadedAt;

    /** PHOTO or VIDEO (null on older rows means PHOTO) */
    @Column(length = 10)
    private String mediaType;

    /** READY, PROCESSING (video being converted) or FAILED (null on older rows means READY) */
    @Column(length = 12)
    private String status;

    /** MP4 file: the video itself, or the motion clip of a Live Photo */
    @Column(length = 80)
    private String videoName;

    /** Uploaded original kept only until it is converted */
    @Column(length = 80)
    private String sourceName;

    private Double durationSec;

    @Column(length = 200)
    private String statusNote;

    /** Deleted from the public page with the PIN; kept until the admin restores it or deletes it for good */
    private LocalDateTime deletedAt;
    @Column(length = 60)
    private String deletedBy;

    public Long getId() { return id; }
    public Long getAlbumId() { return albumId; }
    public void setAlbumId(Long albumId) { this.albumId = albumId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getThumbName() { return thumbName; }
    public void setThumbName(String thumbName) { this.thumbName = thumbName; }
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }
    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }
    public Long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }
    public LocalDateTime getCapturedAt() { return capturedAt; }
    public void setCapturedAt(LocalDateTime capturedAt) { this.capturedAt = capturedAt; }
    public Boolean getDateGuessed() { return dateGuessed; }
    public void setDateGuessed(Boolean dateGuessed) { this.dateGuessed = dateGuessed; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public Boolean getHighlight() { return highlight; }
    public void setHighlight(Boolean highlight) { this.highlight = highlight; }
    public Boolean getHidden() { return hidden; }
    public void setHidden(Boolean hidden) { this.hidden = hidden; }
    public String getFingerprint() { return fingerprint; }
    public void setFingerprint(String fingerprint) { this.fingerprint = fingerprint; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getVideoName() { return videoName; }
    public void setVideoName(String videoName) { this.videoName = videoName; }
    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    public Double getDurationSec() { return durationSec; }
    public void setDurationSec(Double durationSec) { this.durationSec = durationSec; }
    public String getStatusNote() { return statusNote; }
    public void setStatusNote(String statusNote) { this.statusNote = statusNote; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
    public String getDeletedBy() { return deletedBy; }
    public void setDeletedBy(String deletedBy) { this.deletedBy = deletedBy; }

    public boolean isVideo() { return "VIDEO".equals(mediaType); }
    public boolean isReady() { return status == null || "READY".equals(status); }
    /** A photo with a motion clip (Live Photo) */
    public boolean isLive() { return !isVideo() && videoName != null; }
}
