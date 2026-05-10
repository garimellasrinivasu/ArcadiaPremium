package com.arcadia.premium.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "estimation_tabs")
public class EstimationTab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnore
    private Project project;

    @Column(nullable = false)
    private String name;

    private String subtitle;

    @Column(nullable = false)
    private Integer sortOrder = 0;

    /** Tab type: COVER, ASSUMPTIONS, DATA_TABLE, SUMMARY, CUSTOM */
    @Column(nullable = false)
    private String tabType = "DATA_TABLE";

    @OneToMany(mappedBy = "tab", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<EstimationRow> rows = new ArrayList<>();

    /** Column definitions as JSON: [{"key":"col1","label":"Description","type":"text"},{"key":"col2","label":"Rate","type":"number"}] */
    @Column(columnDefinition = "TEXT")
    private String columnsJson;

    /** Cover/Notes content as JSON (for COVER and ASSUMPTIONS tabs) */
    @Column(columnDefinition = "TEXT")
    private String metadataJson;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public EstimationTab() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public String getTabType() { return tabType; }
    public void setTabType(String tabType) { this.tabType = tabType; }
    public List<EstimationRow> getRows() { return rows; }
    public void setRows(List<EstimationRow> rows) { this.rows = rows; }
    public String getColumnsJson() { return columnsJson; }
    public void setColumnsJson(String columnsJson) { this.columnsJson = columnsJson; }
    public String getMetadataJson() { return metadataJson; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
