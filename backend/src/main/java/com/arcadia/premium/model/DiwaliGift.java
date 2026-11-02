package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** One Deewali gift / invitation: who receives it, where it goes and who delivers it. */
@Entity
@Table(name = "diwali_gifts")
public class DiwaliGift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Festival year, so next year's list can be kept separately */
    @Column(name = "festival_year", nullable = false)
    private Integer festivalYear;

    @Column(nullable = false)
    private String recipientName;

    /** Company / designation / relation */
    private String organisation;

    /** CUSTOMER, PARTNER, VENDOR, OFFICIAL, EMPLOYEE, FRIENDS_FAMILY, OTHER */
    private String category;

    /** VIP or GENERAL gift box */
    @Column(length = 10)
    private String boxType;

    private String giftItem;
    private Integer quantity;

    @Column(length = 1000)
    private String address;
    private String city;
    private String pincode;

    private String contactNumber;
    private String alternateNumber;

    /** Person responsible for delivering it */
    private String responsiblePerson;

    /** HAND or COURIER */
    private String deliveryMode;
    private String trackingNumber;

    /** PLANNED, PACKED, DISPATCHED, DELIVERED, CANCELLED */
    @Column(nullable = false, length = 20)
    private String status = "PLANNED";

    private LocalDate plannedDate;
    private LocalDate deliveredOn;

    /** Invitation card sent / given */
    private Boolean invitationSent;

    @Column(length = 2000)
    private String remarks;

    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public Integer getFestivalYear() { return festivalYear; }
    public void setFestivalYear(Integer festivalYear) { this.festivalYear = festivalYear; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public String getOrganisation() { return organisation; }
    public void setOrganisation(String organisation) { this.organisation = organisation; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getBoxType() { return boxType; }
    public void setBoxType(String boxType) { this.boxType = boxType; }
    public String getGiftItem() { return giftItem; }
    public void setGiftItem(String giftItem) { this.giftItem = giftItem; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public String getAlternateNumber() { return alternateNumber; }
    public void setAlternateNumber(String alternateNumber) { this.alternateNumber = alternateNumber; }
    public String getResponsiblePerson() { return responsiblePerson; }
    public void setResponsiblePerson(String responsiblePerson) { this.responsiblePerson = responsiblePerson; }
    public String getDeliveryMode() { return deliveryMode; }
    public void setDeliveryMode(String deliveryMode) { this.deliveryMode = deliveryMode; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getPlannedDate() { return plannedDate; }
    public void setPlannedDate(LocalDate plannedDate) { this.plannedDate = plannedDate; }
    public LocalDate getDeliveredOn() { return deliveredOn; }
    public void setDeliveredOn(LocalDate deliveredOn) { this.deliveredOn = deliveredOn; }
    public Boolean getInvitationSent() { return invitationSent; }
    public void setInvitationSent(Boolean invitationSent) { this.invitationSent = invitationSent; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
