package com.arcadia.premium.dto;

import com.arcadia.premium.model.StockTransfer;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class StockTransferDto {
    private Long id;
    private String transferNo;
    private Long fromProjectId;
    private String fromProjectName;
    private Long toProjectId;
    private String toProjectName;
    private Long fromWarehouseId;
    private String fromWarehouseName;
    private Long toWarehouseId;
    private String toWarehouseName;
    private String transferType;
    private LocalDate transferDate;
    private String status;
    private String remarks;
    private List<StockTransferItemDto> items;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static StockTransferDto fromEntity(StockTransfer e) {
        StockTransferDto d = new StockTransferDto();
        d.id = e.getId();
        d.transferNo = e.getTransferNo();
        if (e.getFromProject() != null) {
            d.fromProjectId = e.getFromProject().getId();
            d.fromProjectName = e.getFromProject().getName();
        }
        if (e.getToProject() != null) {
            d.toProjectId = e.getToProject().getId();
            d.toProjectName = e.getToProject().getName();
        }
        if (e.getFromWarehouse() != null) {
            d.fromWarehouseId = e.getFromWarehouse().getId();
            d.fromWarehouseName = e.getFromWarehouse().getName();
        }
        if (e.getToWarehouse() != null) {
            d.toWarehouseId = e.getToWarehouse().getId();
            d.toWarehouseName = e.getToWarehouse().getName();
        }
        d.transferType = e.getTransferType();
        d.transferDate = e.getTransferDate();
        d.status = e.getStatus();
        d.remarks = e.getRemarks();
        if (e.getItems() != null) {
            d.items = e.getItems().stream().map(StockTransferItemDto::fromEntity).collect(Collectors.toList());
        }
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTransferNo() { return transferNo; }
    public void setTransferNo(String transferNo) { this.transferNo = transferNo; }
    public Long getFromProjectId() { return fromProjectId; }
    public void setFromProjectId(Long fromProjectId) { this.fromProjectId = fromProjectId; }
    public String getFromProjectName() { return fromProjectName; }
    public void setFromProjectName(String fromProjectName) { this.fromProjectName = fromProjectName; }
    public Long getToProjectId() { return toProjectId; }
    public void setToProjectId(Long toProjectId) { this.toProjectId = toProjectId; }
    public String getToProjectName() { return toProjectName; }
    public void setToProjectName(String toProjectName) { this.toProjectName = toProjectName; }
    public Long getFromWarehouseId() { return fromWarehouseId; }
    public void setFromWarehouseId(Long fromWarehouseId) { this.fromWarehouseId = fromWarehouseId; }
    public String getFromWarehouseName() { return fromWarehouseName; }
    public void setFromWarehouseName(String fromWarehouseName) { this.fromWarehouseName = fromWarehouseName; }
    public Long getToWarehouseId() { return toWarehouseId; }
    public void setToWarehouseId(Long toWarehouseId) { this.toWarehouseId = toWarehouseId; }
    public String getToWarehouseName() { return toWarehouseName; }
    public void setToWarehouseName(String toWarehouseName) { this.toWarehouseName = toWarehouseName; }
    public String getTransferType() { return transferType; }
    public void setTransferType(String transferType) { this.transferType = transferType; }
    public LocalDate getTransferDate() { return transferDate; }
    public void setTransferDate(LocalDate transferDate) { this.transferDate = transferDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<StockTransferItemDto> getItems() { return items; }
    public void setItems(List<StockTransferItemDto> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
