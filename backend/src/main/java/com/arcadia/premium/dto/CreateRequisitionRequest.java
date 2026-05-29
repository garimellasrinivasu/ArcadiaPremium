package com.arcadia.premium.dto;

import java.time.LocalDate;
import java.util.List;

public class CreateRequisitionRequest {
    private Long projectId;
    private String unitName;
    private LocalDate requisitionDate;
    private LocalDate requiredDate;
    private String remarks;
    private List<CreateRequisitionItemRequest> items;

    // Getters and Setters
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getUnitName() { return unitName; }
    public void setUnitName(String unitName) { this.unitName = unitName; }
    public LocalDate getRequisitionDate() { return requisitionDate; }
    public void setRequisitionDate(LocalDate requisitionDate) { this.requisitionDate = requisitionDate; }
    public LocalDate getRequiredDate() { return requiredDate; }
    public void setRequiredDate(LocalDate requiredDate) { this.requiredDate = requiredDate; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<CreateRequisitionItemRequest> getItems() { return items; }
    public void setItems(List<CreateRequisitionItemRequest> items) { this.items = items; }
}
