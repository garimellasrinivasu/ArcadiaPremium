package com.arcadia.premium.dto;

import com.arcadia.premium.model.MeasurementBook;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class MeasurementBookDto {
    private Long id;
    private String mbNumber;
    private Long workOrderId;
    private String woNumber;
    private Long projectId;
    private String projectName;
    private LocalDate mbDate;
    private String status;
    private String remarks;
    private List<MBItemDto> items;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MeasurementBookDto fromEntity(MeasurementBook e) {
        MeasurementBookDto d = new MeasurementBookDto();
        d.id = e.getId();
        d.mbNumber = e.getMbNumber();
        if (e.getWorkOrder() != null) {
            d.workOrderId = e.getWorkOrder().getId();
            d.woNumber = e.getWorkOrder().getWoNumber();
        }
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        d.mbDate = e.getMbDate();
        d.status = e.getStatus();
        d.remarks = e.getRemarks();
        if (e.getItems() != null) {
            d.items = e.getItems().stream().map(MBItemDto::fromEntity).collect(Collectors.toList());
        }
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMbNumber() { return mbNumber; }
    public void setMbNumber(String mbNumber) { this.mbNumber = mbNumber; }
    public Long getWorkOrderId() { return workOrderId; }
    public void setWorkOrderId(Long workOrderId) { this.workOrderId = workOrderId; }
    public String getWoNumber() { return woNumber; }
    public void setWoNumber(String woNumber) { this.woNumber = woNumber; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public LocalDate getMbDate() { return mbDate; }
    public void setMbDate(LocalDate mbDate) { this.mbDate = mbDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<MBItemDto> getItems() { return items; }
    public void setItems(List<MBItemDto> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
