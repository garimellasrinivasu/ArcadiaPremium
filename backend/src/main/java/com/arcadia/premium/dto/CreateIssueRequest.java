package com.arcadia.premium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreateIssueRequest {
    private Long projectId;
    private Long requisitionId;
    private Long warehouseId;
    private LocalDate issueDate;
    private String issuedToEmployee;
    private String issuedToContractor;
    private String remarks;
    private List<IssueItemRequest> items;

    public static class IssueItemRequest {
        private Long materialId;
        private String uom;
        private BigDecimal issueQty;
        private String remarks;

        public Long getMaterialId() { return materialId; }
        public void setMaterialId(Long materialId) { this.materialId = materialId; }
        public String getUom() { return uom; }
        public void setUom(String uom) { this.uom = uom; }
        public BigDecimal getIssueQty() { return issueQty; }
        public void setIssueQty(BigDecimal issueQty) { this.issueQty = issueQty; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
    }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public Long getRequisitionId() { return requisitionId; }
    public void setRequisitionId(Long requisitionId) { this.requisitionId = requisitionId; }
    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }
    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
    public String getIssuedToEmployee() { return issuedToEmployee; }
    public void setIssuedToEmployee(String issuedToEmployee) { this.issuedToEmployee = issuedToEmployee; }
    public String getIssuedToContractor() { return issuedToContractor; }
    public void setIssuedToContractor(String issuedToContractor) { this.issuedToContractor = issuedToContractor; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<IssueItemRequest> getItems() { return items; }
    public void setItems(List<IssueItemRequest> items) { this.items = items; }
}
