package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;

public class ApproveAttendanceRequest {

    @NotBlank
    private String action; // APPROVED or REJECTED

    private String remarks;

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
