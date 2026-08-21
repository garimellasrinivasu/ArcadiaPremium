package com.arcadia.premium.dto;

import com.arcadia.premium.model.AccountCategory;

import java.time.LocalDateTime;

public class AccountCategoryDto {

    private Long id;
    private String projectName;
    private String code;
    private String name;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AccountCategoryDto fromEntity(AccountCategory e) {
        AccountCategoryDto d = new AccountCategoryDto();
        d.id = e.getId();
        d.projectName = e.getProjectName();
        d.code = e.getCode();
        d.name = e.getName();
        d.sortOrder = e.getSortOrder();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    public static AccountCategory toEntity(AccountCategoryDto d) {
        AccountCategory e = new AccountCategory();
        e.setId(d.id);
        e.setProjectName(d.projectName);
        e.setCode(d.code);
        e.setName(d.name);
        e.setSortOrder(d.sortOrder);
        return e;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
