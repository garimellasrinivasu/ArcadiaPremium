package com.arcadia.premium.dto;

public class EstimationRowDTO {
    private Long id;
    private Long tabId;
    private Integer sortOrder;
    private String rowType;
    private String cellsJson;
    private String sectionGroup;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTabId() { return tabId; }
    public void setTabId(Long tabId) { this.tabId = tabId; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public String getRowType() { return rowType; }
    public void setRowType(String rowType) { this.rowType = rowType; }
    public String getCellsJson() { return cellsJson; }
    public void setCellsJson(String cellsJson) { this.cellsJson = cellsJson; }
    public String getSectionGroup() { return sectionGroup; }
    public void setSectionGroup(String sectionGroup) { this.sectionGroup = sectionGroup; }
}
