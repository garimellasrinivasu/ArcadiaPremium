package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

@Entity
@Table(name = "estimation_rows")
public class EstimationRow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tab_id", nullable = false)
    @JsonIgnore
    private EstimationTab tab;

    @Column(nullable = false)
    private Integer sortOrder = 0;

    /** Row type: HEADER (section header), DATA (editable data row), SUBTOTAL, TOTAL, NOTE */
    @Column(nullable = false)
    private String rowType = "DATA";

    /** Cell values as JSON: {"col1":"Earth Work","col2":40,"col3":2632,"col4":"=col2*col3"} */
    @Column(columnDefinition = "TEXT")
    private String cellsJson;

    /** Section group name for grouping rows under section headers */
    private String sectionGroup;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public EstimationRow() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public EstimationTab getTab() { return tab; }
    public void setTab(EstimationTab tab) { this.tab = tab; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public String getRowType() { return rowType; }
    public void setRowType(String rowType) { this.rowType = rowType; }
    public String getCellsJson() { return cellsJson; }
    public void setCellsJson(String cellsJson) { this.cellsJson = cellsJson; }
    public String getSectionGroup() { return sectionGroup; }
    public void setSectionGroup(String sectionGroup) { this.sectionGroup = sectionGroup; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
