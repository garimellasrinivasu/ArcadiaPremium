package com.arcadia.premium.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Wrapper DTO for attendance report responses.
 */
public class AttendanceReportDto {

    private LocalDate fromDate;
    private LocalDate toDate;
    private String siteName; // filter applied (null = all sites)

    // Overall totals
    private int totalRecords;
    private int totalWorkers;
    private int totalMale;
    private int totalFemale;
    private int totalMaleMastri;
    private int totalFemaleMastri;
    private int totalMaleHelper;
    private int totalFemaleHelper;
    private int totalDays;

    // Summaries
    private List<SiteSummary> siteSummaries;
    private List<DateSummary> dateSummaries;

    // Detail records (includes imageBase64 for report viewing)
    private List<AttendanceRecordDto> records;

    // Getters and Setters
    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }
    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }
    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }
    public int getTotalWorkers() { return totalWorkers; }
    public void setTotalWorkers(int totalWorkers) { this.totalWorkers = totalWorkers; }
    public int getTotalMale() { return totalMale; }
    public void setTotalMale(int totalMale) { this.totalMale = totalMale; }
    public int getTotalFemale() { return totalFemale; }
    public void setTotalFemale(int totalFemale) { this.totalFemale = totalFemale; }
    public int getTotalMaleMastri() { return totalMaleMastri; }
    public void setTotalMaleMastri(int totalMaleMastri) { this.totalMaleMastri = totalMaleMastri; }
    public int getTotalFemaleMastri() { return totalFemaleMastri; }
    public void setTotalFemaleMastri(int totalFemaleMastri) { this.totalFemaleMastri = totalFemaleMastri; }
    public int getTotalMaleHelper() { return totalMaleHelper; }
    public void setTotalMaleHelper(int totalMaleHelper) { this.totalMaleHelper = totalMaleHelper; }
    public int getTotalFemaleHelper() { return totalFemaleHelper; }
    public void setTotalFemaleHelper(int totalFemaleHelper) { this.totalFemaleHelper = totalFemaleHelper; }
    public int getTotalDays() { return totalDays; }
    public void setTotalDays(int totalDays) { this.totalDays = totalDays; }
    public List<SiteSummary> getSiteSummaries() { return siteSummaries; }
    public void setSiteSummaries(List<SiteSummary> siteSummaries) { this.siteSummaries = siteSummaries; }
    public List<DateSummary> getDateSummaries() { return dateSummaries; }
    public void setDateSummaries(List<DateSummary> dateSummaries) { this.dateSummaries = dateSummaries; }
    public List<AttendanceRecordDto> getRecords() { return records; }
    public void setRecords(List<AttendanceRecordDto> records) { this.records = records; }

    /**
     * Summary grouped by site name.
     */
    public static class SiteSummary {
        private String siteName;
        private int totalRecords;
        private int totalWorkers;
        private int totalMale;
        private int totalFemale;
        private int totalMaleMastri;
        private int totalFemaleMastri;
        private int totalMaleHelper;
        private int totalFemaleHelper;
        private int totalDays;

        public String getSiteName() { return siteName; }
        public void setSiteName(String siteName) { this.siteName = siteName; }
        public int getTotalRecords() { return totalRecords; }
        public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }
        public int getTotalWorkers() { return totalWorkers; }
        public void setTotalWorkers(int totalWorkers) { this.totalWorkers = totalWorkers; }
        public int getTotalMale() { return totalMale; }
        public void setTotalMale(int totalMale) { this.totalMale = totalMale; }
        public int getTotalFemale() { return totalFemale; }
        public void setTotalFemale(int totalFemale) { this.totalFemale = totalFemale; }
        public int getTotalMaleMastri() { return totalMaleMastri; }
        public void setTotalMaleMastri(int totalMaleMastri) { this.totalMaleMastri = totalMaleMastri; }
        public int getTotalFemaleMastri() { return totalFemaleMastri; }
        public void setTotalFemaleMastri(int totalFemaleMastri) { this.totalFemaleMastri = totalFemaleMastri; }
        public int getTotalMaleHelper() { return totalMaleHelper; }
        public void setTotalMaleHelper(int totalMaleHelper) { this.totalMaleHelper = totalMaleHelper; }
        public int getTotalFemaleHelper() { return totalFemaleHelper; }
        public void setTotalFemaleHelper(int totalFemaleHelper) { this.totalFemaleHelper = totalFemaleHelper; }
        public int getTotalDays() { return totalDays; }
        public void setTotalDays(int totalDays) { this.totalDays = totalDays; }
    }

    /**
     * Summary grouped by date.
     */
    public static class DateSummary {
        private LocalDate date;
        private int totalRecords;
        private int totalWorkers;
        private int totalMale;
        private int totalFemale;
        private int totalMaleMastri;
        private int totalFemaleMastri;
        private int totalMaleHelper;
        private int totalFemaleHelper;
        private int siteCount;

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public int getTotalRecords() { return totalRecords; }
        public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }
        public int getTotalWorkers() { return totalWorkers; }
        public void setTotalWorkers(int totalWorkers) { this.totalWorkers = totalWorkers; }
        public int getTotalMale() { return totalMale; }
        public void setTotalMale(int totalMale) { this.totalMale = totalMale; }
        public int getTotalFemale() { return totalFemale; }
        public void setTotalFemale(int totalFemale) { this.totalFemale = totalFemale; }
        public int getTotalMaleMastri() { return totalMaleMastri; }
        public void setTotalMaleMastri(int totalMaleMastri) { this.totalMaleMastri = totalMaleMastri; }
        public int getTotalFemaleMastri() { return totalFemaleMastri; }
        public void setTotalFemaleMastri(int totalFemaleMastri) { this.totalFemaleMastri = totalFemaleMastri; }
        public int getTotalMaleHelper() { return totalMaleHelper; }
        public void setTotalMaleHelper(int totalMaleHelper) { this.totalMaleHelper = totalMaleHelper; }
        public int getTotalFemaleHelper() { return totalFemaleHelper; }
        public void setTotalFemaleHelper(int totalFemaleHelper) { this.totalFemaleHelper = totalFemaleHelper; }
        public int getSiteCount() { return siteCount; }
        public void setSiteCount(int siteCount) { this.siteCount = siteCount; }
    }

    /**
     * Individual attendance record (lightweight, no image).
     */
    public static class AttendanceRecordDto {
        private Long id;
        private LocalDate attendanceDate;
        private String siteName;
        private int totalWorkers;
        private int maleCount;
        private int femaleCount;
        private int maleMastriCount;
        private int femaleMastriCount;
        private int maleHelperCount;
        private int femaleHelperCount;
        private String remarks;
        private String submittedByName;
        private String status;
        private String approverName;
        private LocalDate approvedDate;
        private String imageBase64;
        private LocalDateTime capturedAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public LocalDate getAttendanceDate() { return attendanceDate; }
        public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }
        public String getSiteName() { return siteName; }
        public void setSiteName(String siteName) { this.siteName = siteName; }
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
        public String getSubmittedByName() { return submittedByName; }
        public void setSubmittedByName(String submittedByName) { this.submittedByName = submittedByName; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getApproverName() { return approverName; }
        public void setApproverName(String approverName) { this.approverName = approverName; }
        public LocalDate getApprovedDate() { return approvedDate; }
        public void setApprovedDate(LocalDate approvedDate) { this.approvedDate = approvedDate; }
        public String getImageBase64() { return imageBase64; }
        public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
        public LocalDateTime getCapturedAt() { return capturedAt; }
        public void setCapturedAt(LocalDateTime capturedAt) { this.capturedAt = capturedAt; }
    }
}
