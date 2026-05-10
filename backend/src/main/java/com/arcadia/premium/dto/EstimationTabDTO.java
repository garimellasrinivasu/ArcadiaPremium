package com.arcadia.premium.dto;

import java.util.List;

public class EstimationTabDTO {
    private Long id;
    private Long projectId;
    private String name;
    private String subtitle;
    private Integer sortOrder;
    private String tabType;
    private String columnsJson;
    private String metadataJson;
    private List<EstimationRowDTO> rows;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public String getTabType() { return tabType; }
    public void setTabType(String tabType) { this.tabType = tabType; }
    public String getColumnsJson() { return columnsJson; }
    public void setColumnsJson(String columnsJson) { this.columnsJson = columnsJson; }
    public String getMetadataJson() { return metadataJson; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
    public List<EstimationRowDTO> getRows() { return rows; }
    public void setRows(List<EstimationRowDTO> rows) { this.rows = rows; }
}
