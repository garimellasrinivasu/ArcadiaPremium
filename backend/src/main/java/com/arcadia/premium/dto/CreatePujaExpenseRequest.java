package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreatePujaExpenseRequest {

    private String pujaName;

    @NotNull(message = "Puja date is required")
    private LocalDate pujaDate;

    @NotBlank(message = "Category is required")
    private String category;

    private String description;
    private String vendor;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    private String paymentStatus;
    private String paidBy;
    private String paymentMode;
    private String receiptNo;
    private String payeeName;
    private String projectName;
    private String notes;
    private String preparedBy;

    // --- Getters & Setters ---

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
}
