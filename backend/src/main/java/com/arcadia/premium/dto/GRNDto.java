package com.arcadia.premium.dto;

import com.arcadia.premium.model.GoodsReceiptNote;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class GRNDto {
    private Long id;
    private String grnNumber;
    private Long mrnId;
    private String mrnNumber;
    private Long warehouseId;
    private String warehouseName;
    private LocalDate grnDate;
    private String remarks;
    private List<GRNItemDto> items;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GRNDto fromEntity(GoodsReceiptNote e) {
        GRNDto d = new GRNDto();
        d.id = e.getId();
        d.grnNumber = e.getGrnNumber();
        if (e.getMrn() != null) {
            d.mrnId = e.getMrn().getId();
            d.mrnNumber = e.getMrn().getMrnNumber();
        }
        if (e.getWarehouse() != null) {
            d.warehouseId = e.getWarehouse().getId();
            d.warehouseName = e.getWarehouse().getName();
        }
        d.grnDate = e.getGrnDate();
        d.remarks = e.getRemarks();
        if (e.getItems() != null) {
            d.items = e.getItems().stream().map(GRNItemDto::fromEntity).collect(Collectors.toList());
        }
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getGrnNumber() { return grnNumber; }
    public void setGrnNumber(String grnNumber) { this.grnNumber = grnNumber; }
    public Long getMrnId() { return mrnId; }
    public void setMrnId(Long mrnId) { this.mrnId = mrnId; }
    public String getMrnNumber() { return mrnNumber; }
    public void setMrnNumber(String mrnNumber) { this.mrnNumber = mrnNumber; }
    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }
    public String getWarehouseName() { return warehouseName; }
    public void setWarehouseName(String warehouseName) { this.warehouseName = warehouseName; }
    public LocalDate getGrnDate() { return grnDate; }
    public void setGrnDate(LocalDate grnDate) { this.grnDate = grnDate; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<GRNItemDto> getItems() { return items; }
    public void setItems(List<GRNItemDto> items) { this.items = items; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
