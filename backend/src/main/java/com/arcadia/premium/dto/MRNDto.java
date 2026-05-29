package com.arcadia.premium.dto;

import com.arcadia.premium.model.MaterialReceiptNote;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class MRNDto {
    private Long id;
    private String mrnNumber;
    private Long projectId;
    private String projectName;
    private Long vendorId;
    private String vendorName;
    private Long purchaseOrderId;
    private String poNumber;
    private String referenceType;
    private LocalDate mrnDate;
    private Long warehouseId;
    private String warehouseName;
    private String grnStatus;
    private String remarks;
    private List<MRNItemDto> items;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MRNDto fromEntity(MaterialReceiptNote e) {
        MRNDto d = new MRNDto();
        d.id = e.getId();
        d.mrnNumber = e.getMrnNumber();
        if (e.getProject() != null) {
            d.projectId = e.getProject().getId();
            d.projectName = e.getProject().getName();
        }
        if (e.getVendor() != null) {
            d.vendorId = e.getVendor().getId();
            d.vendorName = e.getVendor().getName();
        }
        if (e.getPurchaseOrder() != null) {
            d.purchaseOrderId = e.getPurchaseOrder().getId();
            d.poNumber = e.getPurchaseOrder().getPoNumber();
        }
        d.referenceType = e.getReferenceType();
        d.mrnDate = e.getMrnDate();
        if (e.getWarehouse() != null) {
            d.warehouseId = e.getWarehouse().getId();
            d.warehouseName = e.getWarehouse().getName();
        }
        d.grnStatus = e.getGrnStatus();
        d.remarks = e.getRemarks();
        if (e.getItems() != null) {
            d.items = e.getItems().stream().map(MRNItemDto::fromEntity).collect(Collectors.toList());
        }
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMrnNumber() { return mrnNumber; }
    public void setMrnNumber(String mrnNumber) { this.mrnNumber = mrnNumber; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public Long getPurchaseOrderId() { return purchaseOrderId; }
    public void setPurchaseOrderId(Long purchaseOrderId) { this.purchaseOrderId = purchaseOrderId; }
    public String getPoNumber() { return poNumber; }
    public void setPoNumber(String poNumber) { this.poNumber = poNumber; }
    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }
    public LocalDate getMrnDate() { return mrnDate; }
    public void setMrnDate(LocalDate mrnDate) { this.mrnDate = mrnDate; }
    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }
    public String getWarehouseName() { return warehouseName; }
    public void setWarehouseName(String warehouseName) { this.warehouseName = warehouseName; }
    public String getGrnStatus() { return grnStatus; }
    public void setGrnStatus(String grnStatus) { this.grnStatus = grnStatus; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<MRNItemDto> getItems() { return items; }
    public void setItems(List<MRNItemDto> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
