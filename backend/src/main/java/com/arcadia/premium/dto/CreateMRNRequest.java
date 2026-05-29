package com.arcadia.premium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreateMRNRequest {
    private Long projectId;
    private Long purchaseOrderId;
    private LocalDate mrnDate;
    private Long warehouseId;
    private String remarks;
    private List<MRNItemRequest> items;

    public static class MRNItemRequest {
        private Long materialId;
        private String uom;
        private BigDecimal mrnQty;
        private String remarks;

        public Long getMaterialId() { return materialId; }
        public void setMaterialId(Long materialId) { this.materialId = materialId; }
        public String getUom() { return uom; }
        public void setUom(String uom) { this.uom = uom; }
        public BigDecimal getMrnQty() { return mrnQty; }
        public void setMrnQty(BigDecimal mrnQty) { this.mrnQty = mrnQty; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
    }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public Long getPurchaseOrderId() { return purchaseOrderId; }
    public void setPurchaseOrderId(Long purchaseOrderId) { this.purchaseOrderId = purchaseOrderId; }
    public LocalDate getMrnDate() { return mrnDate; }
    public void setMrnDate(LocalDate mrnDate) { this.mrnDate = mrnDate; }
    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<MRNItemRequest> getItems() { return items; }
    public void setItems(List<MRNItemRequest> items) { this.items = items; }
}
