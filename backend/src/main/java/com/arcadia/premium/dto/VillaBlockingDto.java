package com.arcadia.premium.dto;

import com.arcadia.premium.model.VillaBlocking;

import java.time.LocalDateTime;

public class VillaBlockingDto {
    private Long id;
    private Integer villaNumber;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private Double bookingAmount;
    private String notes;
    private String blockedBy;
    private LocalDateTime blockedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VillaBlockingDto fromEntity(VillaBlocking e) {
        VillaBlockingDto d = new VillaBlockingDto();
        d.id = e.getId();
        d.villaNumber = e.getVillaNumber();
        d.customerName = e.getCustomerName();
        d.customerPhone = e.getCustomerPhone();
        d.customerEmail = e.getCustomerEmail();
        d.bookingAmount = e.getBookingAmount();
        d.notes = e.getNotes();
        d.blockedBy = e.getBlockedBy();
        d.blockedAt = e.getBlockedAt();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getVillaNumber() { return villaNumber; }
    public void setVillaNumber(Integer villaNumber) { this.villaNumber = villaNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public Double getBookingAmount() { return bookingAmount; }
    public void setBookingAmount(Double bookingAmount) { this.bookingAmount = bookingAmount; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getBlockedBy() { return blockedBy; }
    public void setBlockedBy(String blockedBy) { this.blockedBy = blockedBy; }
    public LocalDateTime getBlockedAt() { return blockedAt; }
    public void setBlockedAt(LocalDateTime blockedAt) { this.blockedAt = blockedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
