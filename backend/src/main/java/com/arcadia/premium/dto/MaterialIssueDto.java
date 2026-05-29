package com.arcadia.premium.dto;

import com.arcadia.premium.model.MaterialIssue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class MaterialIssueDto {
    private Long id;
    private String issueNo;
    private Long projectId;
    private String projectName;
    private Long requisitionId;
    private String requisitionNo;
    private Long warehouseId;
    private String warehouseName;
    private LocalDate issueDate;
    private String issuedToEmployee;
    private String issuedToContractor;
    private String remarks;
    private List<MaterialIssueItemDto> items;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MaterialIssueDto fromEntity(MaterialIssue e) {
        MaterialIssueDto d = new MaterialIssueDto();
        d.id = e.getId();
        d.issueNo = e.getIssueNo();
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        if (e.getRequisition() != null) {
            d.requisitionId = e.getRequisition().getId();
            d.requisitionNo = e.getRequisition().getRequisitionNo();
        }
        if (e.getWarehouse() != null) {
            d.warehouseId = e.getWarehouse().getId();
            d.warehouseName = e.getWarehouse().getName();
        }
        d.issueDate = e.getIssueDate();
        d.issuedToEmployee = e.getIssuedToEmployee();
        d.issuedToContractor = e.getIssuedToContractor();
        d.remarks = e.getRemarks();
        if (e.getItems() != null) {
            d.items = e.getItems().stream().map(MaterialIssueItemDto::fromEntity).collect(Collectors.toList());
        }
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIssueNo() { return issueNo; }
    public void setIssueNo(String issueNo) { this.issueNo = issueNo; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public Long getRequisitionId() { return requisitionId; }
    public void setRequisitionId(Long requisitionId) { this.requisitionId = requisitionId; }
    public String getRequisitionNo() { return requisitionNo; }
    public void setRequisitionNo(String requisitionNo) { this.requisitionNo = requisitionNo; }
    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }
    public String getWarehouseName() { return warehouseName; }
    public void setWarehouseName(String warehouseName) { this.warehouseName = warehouseName; }
    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
    public String getIssuedToEmployee() { return issuedToEmployee; }
    public void setIssuedToEmployee(String issuedToEmployee) { this.issuedToEmployee = issuedToEmployee; }
    public String getIssuedToContractor() { return issuedToContractor; }
    public void setIssuedToContractor(String issuedToContractor) { this.issuedToContractor = issuedToContractor; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<MaterialIssueItemDto> getItems() { return items; }
    public void setItems(List<MaterialIssueItemDto> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
