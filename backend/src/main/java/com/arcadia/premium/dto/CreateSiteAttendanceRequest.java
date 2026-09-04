package com.arcadia.premium.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreateSiteAttendanceRequest {

    @NotNull
    private LocalDate attendanceDate;

    @NotBlank
    private String siteName;

    @NotBlank
    private String imageBase64;

    @Min(0)
    private int totalWorkers;

    @Min(0)
    private int maleCount;

    @Min(0)
    private int femaleCount;

    // Mastri/Helper breakdown
    @Min(0)
    private int maleMastriCount;

    @Min(0)
    private int femaleMastriCount;

    @Min(0)
    private int maleHelperCount;

    @Min(0)
    private int femaleHelperCount;

    // Half-day breakdown
    @Min(0)
    private int maleMastriHalfDay;

    @Min(0)
    private int femaleMastriHalfDay;

    @Min(0)
    private int maleHelperHalfDay;

    @Min(0)
    private int femaleHelperHalfDay;

    // REGULAR or OT
    private String attendanceType = "REGULAR";

    // Mastri leader ID
    private Long mastriLeaderId;

    // When the photo was captured
    private String captureDateTime;

    private String remarks;

    // Optional: only used for legacy single-approver mode (if no approval chain is configured)
    private Long approverId;

    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }
    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }
    public String getImageBase64() { return imageBase64; }
    public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
    public int getTotalWorkers() { return totalWorkers; }
    public void setTotalWorkers(int totalWorkers) { this.totalWorkers = totalWorkers; }
    public int getMaleCount() { return maleCount; }
    public void setMaleCount(int maleCount) { this.maleCount = maleCount; }
    public int getFemaleCount() { return femaleCount; }
    public void setFemaleCount(int femaleCount) { this.femaleCount = femaleCount; }
    public int getMaleMastriCount() { return maleMastriCount; }
    public void setMaleMastriCount(int maleMastriCount) { this.maleMastriCount = maleMastriCount; }
    public int getFemaleMastriCount() { return femaleMastriCount; }
    public void setFemaleMastriCount(int femaleMastriCount) { this.femaleMastriCount = femaleMastriCount; }
    public int getMaleHelperCount() { return maleHelperCount; }
    public void setMaleHelperCount(int maleHelperCount) { this.maleHelperCount = maleHelperCount; }
    public int getFemaleHelperCount() { return femaleHelperCount; }
    public void setFemaleHelperCount(int femaleHelperCount) { this.femaleHelperCount = femaleHelperCount; }
    public int getMaleMastriHalfDay() { return maleMastriHalfDay; }
    public void setMaleMastriHalfDay(int v) { this.maleMastriHalfDay = v; }
    public int getFemaleMastriHalfDay() { return femaleMastriHalfDay; }
    public void setFemaleMastriHalfDay(int v) { this.femaleMastriHalfDay = v; }
    public int getMaleHelperHalfDay() { return maleHelperHalfDay; }
    public void setMaleHelperHalfDay(int v) { this.maleHelperHalfDay = v; }
    public int getFemaleHelperHalfDay() { return femaleHelperHalfDay; }
    public void setFemaleHelperHalfDay(int v) { this.femaleHelperHalfDay = v; }
    public String getAttendanceType() { return attendanceType; }
    public void setAttendanceType(String attendanceType) { this.attendanceType = attendanceType; }
    public Long getMastriLeaderId() { return mastriLeaderId; }
    public void setMastriLeaderId(Long mastriLeaderId) { this.mastriLeaderId = mastriLeaderId; }
    public String getCaptureDateTime() { return captureDateTime; }
    public void setCaptureDateTime(String captureDateTime) { this.captureDateTime = captureDateTime; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Long getApproverId() { return approverId; }
    public void setApproverId(Long approverId) { this.approverId = approverId; }
}
