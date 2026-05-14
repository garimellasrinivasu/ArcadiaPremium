package com.arcadia.premium.dto;

import com.arcadia.premium.model.User;

import java.time.LocalDateTime;
import java.util.Set;

public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private boolean active;
    private boolean mustChangePassword;
    private RoleDto role;
    private Set<String> allowedPages;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static UserDto fromEntity(User user) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.firstName = user.getFirstName();
        dto.lastName = user.getLastName();
        dto.email = user.getEmail();
        dto.phone = user.getPhone();
        dto.active = user.isActive();
        dto.mustChangePassword = user.isMustChangePassword();
        dto.createdAt = user.getCreatedAt();
        dto.updatedAt = user.getUpdatedAt();
        dto.role = user.getRole() != null ? RoleDto.fromEntity(user.getRole()) : null;
        dto.allowedPages = user.getAllowedPages();
        return dto;
    }

    /** Lightweight version — only id, name, email, active, role. No sensitive fields. */
    public static UserDto basicFromEntity(User user) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.firstName = user.getFirstName();
        dto.lastName = user.getLastName();
        dto.email = user.getEmail();
        dto.active = user.isActive();
        dto.role = user.getRole() != null ? RoleDto.fromEntity(user.getRole()) : null;
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }
    public RoleDto getRole() { return role; }
    public void setRole(RoleDto role) { this.role = role; }
    public Set<String> getAllowedPages() { return allowedPages; }
    public void setAllowedPages(Set<String> allowedPages) { this.allowedPages = allowedPages; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
