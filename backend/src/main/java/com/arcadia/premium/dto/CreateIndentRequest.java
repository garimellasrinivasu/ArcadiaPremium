package com.arcadia.premium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreateIndentRequest {
    private Long projectId;
    private LocalDate indentDate;
    private String referenceType;
    private Long requisitionId;
    private String remarks;
    private List<IndentItemRequest> items;

    public static class IndentItemRequest {
        private Long materialId;
        private String uom;
        private BigDecimal indentQty;
        private String remarks;

        public Long getMaterialId() { return materialId; }
        public void setMaterialId(Long materialId) { this.materialId = materialId; }
        public String getUom() { return uom; }
        public void setUom(String uom) { this.uom = uom; }
        public BigDecimal getIndentQty() { return indentQty; }
        public void setIndentQty(BigDecimal indentQty) { this.indentQty = indentQty; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
    }

    // Getters and Setters
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public LocalDate getIndentDate() { return indentDate; }
    public void setIndentDate(LocalDate indentDate) { this.indentDate = indentDate; }
    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }
    public Long getRequisitionId() { return requisitionId; }
    public void setRequisitionId(Long requisitionId) { this.requisitionId = requisitionId; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<IndentItemRequest> getItems() { return items; }
    public void setItems(List<IndentItemRequest> items) { this.items = items; }
}
