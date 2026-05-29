package com.arcadia.premium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreateGRNRequest {
    private Long mrnId;
    private Long warehouseId;
    private LocalDate grnDate;
    private String remarks;
    private List<GRNItemRequest> items;

    public static class GRNItemRequest {
        private Long materialId;
        private String uom;
        private BigDecimal grnQty;
        private BigDecimal acceptedQty;
        private BigDecimal rejectedQty;
        private String inspectionType;
        private String inspectedBy;

        public Long getMaterialId() { return materialId; }
        public void setMaterialId(Long materialId) { this.materialId = materialId; }
        public String getUom() { return uom; }
        public void setUom(String uom) { this.uom = uom; }
        public BigDecimal getGrnQty() { return grnQty; }
        public void setGrnQty(BigDecimal grnQty) { this.grnQty = grnQty; }
        public BigDecimal getAcceptedQty() { return acceptedQty; }
        public void setAcceptedQty(BigDecimal acceptedQty) { this.acceptedQty = acceptedQty; }
        public BigDecimal getRejectedQty() { return rejectedQty; }
        public void setRejectedQty(BigDecimal rejectedQty) { this.rejectedQty = rejectedQty; }
        public String getInspectionType() { return inspectionType; }
        public void setInspectionType(String inspectionType) { this.inspectionType = inspectionType; }
        public String getInspectedBy() { return inspectedBy; }
        public void setInspectedBy(String inspectedBy) { this.inspectedBy = inspectedBy; }
    }

    public Long getMrnId() { return mrnId; }
    public void setMrnId(Long mrnId) { this.mrnId = mrnId; }
    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }
    public LocalDate getGrnDate() { return grnDate; }
    public void setGrnDate(LocalDate grnDate) { this.grnDate = grnDate; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<GRNItemRequest> getItems() { return items; }
    public void setItems(List<GRNItemRequest> items) { this.items = items; }
}
