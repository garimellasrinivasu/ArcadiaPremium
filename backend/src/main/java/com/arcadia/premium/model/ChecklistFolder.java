package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** A sub-folder inside a checklist item (and optionally inside another sub-folder), like Project Documents folders. */
@Entity
@Table(name = "checklist_folders", indexes = @Index(columnList = "item_id"))
public class ChecklistFolder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    /** Null = directly under the item */
    @Column(name = "parent_id")
    private Long parentId;

    @Column(nullable = false)
    private String name;

    private String createdBy;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
