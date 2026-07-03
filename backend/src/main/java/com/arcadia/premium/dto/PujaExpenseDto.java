package com.arcadia.premium.dto;

import com.arcadia.premium.model.PujaExpense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PujaExpenseDto {

    private Long id;
    private String pujaName;
    private LocalDate pujaDate;
    private String category;
    private String description;
    private String vendor;
    private BigDecimal amount;
    private String paymentStatus;
    private String paidBy;
    private String paymentMode;
    private String receiptNo;
    private String payeeName;
    private String projectName;
    private String notes;
    private String preparedBy;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PujaExpenseDto fromEntity(PujaExpense e) {
        PujaExpenseDto dto = new PujaExpenseDto();
        dto.id = e.getId();
        dto.pujaName = e.getPujaName();
        dto.pujaDate = e.getPujaDate();
        dto.category = e.getCategory();
        dto.description = e.getDescription();
        dto.vendor = e.getVendor();
        dto.amount = e.getAmount();
        dto.paymentStatus = e.getPaymentStatus();
        dto.paidBy = e.getPaidBy();
        dto.paymentMode = e.getPaymentMode();
        dto.receiptNo = e.getReceiptNo();
        dto.payeeName = e.getPayeeName();
        dto.projectName = e.getProjectName();
        dto.notes = e.getNotes();
        dto.preparedBy = e.getPreparedBy();
        dto.createdBy = e.getCreatedBy();
        dto.createdAt = e.getCreatedAt();
        dto.updatedAt = e.getUpdatedAt();
        return dto;
    }

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPujaName() { return pujaName; }
    public void setPujaName(String pujaName) { this.pujaName = pujaName; }

    public LocalDate getPujaDate() { return pujaDate; }
    public void setPujaDate(LocalDate pujaDate) { this.pujaDate = pujaDate; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getVendor() { return vendor; }
    public void setVendor(String vendor) { this.vendor = vendor; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaidBy() { return paidBy; }
    public void setPaidBy(String paidBy) { this.paidBy = paidBy; }

    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

    public String getReceiptNo() { return receiptNo; }
    public void setReceiptNo(String receiptNo) { this.receiptNo = receiptNo; }

    public String getPayeeName() { return payeeName; }
    public void setPayeeName(String payeeName) { this.payeeName = payeeName; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getPreparedBy() { return preparedBy; }
    public void setPreparedBy(String preparedBy) { this.preparedBy = preparedBy; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
