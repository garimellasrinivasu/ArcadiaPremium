package com.arcadia.premium.dto;

import com.arcadia.premium.model.MaterialRequisition;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class MaterialRequisitionDto {
    private Long id;
    private String requisitionNo;
    private Long projectId;
    private String projectName;
    private String unitName;
    private LocalDate requisitionDate;
    private LocalDate requiredDate;
    private String status;
    private String indentStatus;
    private String issueStatus;
    private String remarks;
    private List<RequisitionItemDto> items;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MaterialRequisitionDto fromEntity(MaterialRequisition e) {
        MaterialRequisitionDto d = new MaterialRequisitionDto();
        d.id = e.getId();
        d.requisitionNo = e.getRequisitionNo();
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        d.unitName = e.getUnitName();
        d.requisitionDate = e.getRequisitionDate();
        d.requiredDate = e.getRequiredDate();
        d.status = e.getStatus();
        d.indentStatus = e.getIndentStatus();
        d.issueStatus = e.getIssueStatus();
        d.remarks = e.getRemarks();
        if (e.getItems() != null) {
            d.items = e.getItems().stream()
                    .map(RequisitionItemDto::fromEntity)
                    .collect(Collectors.toList());
        }
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRequisitionNo() { return requisitionNo; }
    public void setRequisitionNo(String requisitionNo) { this.requisitionNo = requisitionNo; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getUnitName() { return unitName; }
    public void setUnitName(String unitName) { this.unitName = unitName; }
    public LocalDate getRequisitionDate() { return requisitionDate; }
    public void setRequisitionDate(LocalDate requisitionDate) { this.requisitionDate = requisitionDate; }
    public LocalDate getRequiredDate() { return requiredDate; }
    public void setRequiredDate(LocalDate requiredDate) { this.requiredDate = requiredDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getIndentStatus() { return indentStatus; }
    public void setIndentStatus(String indentStatus) { this.indentStatus = indentStatus; }
    public String getIssueStatus() { return issueStatus; }
    public void setIssueStatus(String issueStatus) { this.issueStatus = issueStatus; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<RequisitionItemDto> getItems() { return items; }
    public void setItems(List<RequisitionItemDto> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
