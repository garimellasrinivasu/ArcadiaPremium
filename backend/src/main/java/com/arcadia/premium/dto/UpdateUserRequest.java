package com.arcadia.premium.dto;

import java.util.Set;

public class UpdateUserRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Set<Long> roleIds;
    private Boolean active;
    private Set<String> allowedPages;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Set<Long> getRoleIds() { return roleIds; }
    public void setRoleIds(Set<Long> roleIds) { this.roleIds = roleIds; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Set<String> getAllowedPages() { return allowedPages; }
    public void setAllowedPages(Set<String> allowedPages) { this.allowedPages = allowedPages; }
}
