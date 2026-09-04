package com.arcadia.premium.dto;

import com.arcadia.premium.model.MastriLeader;

import java.time.LocalDateTime;

public class MastriLeaderDto {
    private Long id;
    private String name;
    private String phone;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MastriLeaderDto fromEntity(MastriLeader e) {
        MastriLeaderDto d = new MastriLeaderDto();
        d.id = e.getId();
        d.name = e.getName();
        d.phone = e.getPhone();
        d.active = e.isActive();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
