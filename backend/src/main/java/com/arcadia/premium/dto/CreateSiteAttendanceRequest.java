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
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Long getApproverId() { return approverId; }
    public void setApproverId(Long approverId) { this.approverId = approverId; }
}
