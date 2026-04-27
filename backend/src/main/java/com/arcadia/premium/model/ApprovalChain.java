package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "approval_chains")
public class ApprovalChain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;  // e.g. "Office Assistant Default Chain"

    @Column(nullable = false)
    private String submitterRoleName;  // e.g. "OFFICE_ASSISTANT" — which role triggers this chain

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "approvalChain", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("stepOrder ASC")
    private List<ApprovalChainStep> steps = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public ApprovalChain() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSubmitterRoleName() { return submitterRoleName; }
    public void setSubmitterRoleName(String submitterRoleName) { this.submitterRoleName = submitterRoleName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public List<ApprovalChainStep> getSteps() { return steps; }
    public void setSteps(List<ApprovalChainStep> steps) { this.steps = steps; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
