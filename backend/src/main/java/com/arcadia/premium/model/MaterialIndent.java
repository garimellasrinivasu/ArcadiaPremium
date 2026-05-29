package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "material_indents")
public class MaterialIndent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Auto-generated: IND-001, IND-002, etc. */
    @Column(nullable = false, unique = true)
    private String indentNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private LocalDate indentDate;

    /** DIRECT or FROM_REQUISITION */
    private String referenceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id")
    private MaterialRequisition requisition;

    @Column(nullable = false)
    private String status = "DRAFT";

    private String poStatus = "UNPROCESSED";

    @Column(length = 2000)
    private String remarks;

    @OneToMany(mappedBy = "indent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IndentItem> items = new ArrayList<>();

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public MaterialIndent() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIndentNo() { return indentNo; }
    public void setIndentNo(String indentNo) { this.indentNo = indentNo; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public LocalDate getIndentDate() { return indentDate; }
    public void setIndentDate(LocalDate indentDate) { this.indentDate = indentDate; }
    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }
    public MaterialRequisition getRequisition() { return requisition; }
    public void setRequisition(MaterialRequisition requisition) { this.requisition = requisition; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPoStatus() { return poStatus; }
    public void setPoStatus(String poStatus) { this.poStatus = poStatus; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<IndentItem> getItems() { return items; }
    public void setItems(List<IndentItem> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
