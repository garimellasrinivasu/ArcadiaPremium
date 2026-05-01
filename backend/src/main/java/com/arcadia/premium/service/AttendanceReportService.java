package com.arcadia.premium.service;

import com.arcadia.premium.dto.AttendanceReportDto;
import com.arcadia.premium.dto.AttendanceReportDto.*;
import com.arcadia.premium.model.SiteAttendance;
import com.arcadia.premium.repository.SiteAttendanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceReportService {

    private final SiteAttendanceRepository attendanceRepo;

    public AttendanceReportService(SiteAttendanceRepository attendanceRepo) {
        this.attendanceRepo = attendanceRepo;
    }

    @Transactional(readOnly = true)
    public AttendanceReportDto generateReport(LocalDate fromDate, LocalDate toDate, String siteName) {
        List<SiteAttendance> records;

        if (siteName != null && !siteName.isBlank()) {
            records = attendanceRepo.findApprovedBetweenDatesAndSite(fromDate, toDate, siteName.trim());
        } else {
            records = attendanceRepo.findApprovedBetweenDates(fromDate, toDate);
        }

        AttendanceReportDto report = new AttendanceReportDto();
        report.setFromDate(fromDate);
        report.setToDate(toDate);
        report.setSiteName(siteName);

        // Overall totals
        report.setTotalRecords(records.size());
        report.setTotalWorkers(records.stream().mapToInt(SiteAttendance::getTotalWorkers).sum());
        report.setTotalMale(records.stream().mapToInt(SiteAttendance::getMaleCount).sum());
        report.setTotalFemale(records.stream().mapToInt(SiteAttendance::getFemaleCount).sum());
        report.setTotalMaleMastri(records.stream().mapToInt(SiteAttendance::getMaleMastriCount).sum());
        report.setTotalFemaleMastri(records.stream().mapToInt(SiteAttendance::getFemaleMastriCount).sum());
        report.setTotalMaleHelper(records.stream().mapToInt(SiteAttendance::getMaleHelperCount).sum());
        report.setTotalFemaleHelper(records.stream().mapToInt(SiteAttendance::getFemaleHelperCount).sum());
        report.setTotalDays((int) records.stream()
                .map(SiteAttendance::getAttendanceDate).distinct().count());

        report.setSiteSummaries(buildSiteSummaries(records));
        report.setDateSummaries(buildDateSummaries(records));
        report.setRecords(records.stream().map(this::toRecordDto).toList());

        return report;
    }

    @Transactional(readOnly = true)
    public List<String> getApprovedSiteNames() {
        return attendanceRepo.findDistinctApprovedSiteNames();
    }

    private List<SiteSummary> buildSiteSummaries(List<SiteAttendance> records) {
        Map<String, List<SiteAttendance>> bySite = records.stream()
                .collect(Collectors.groupingBy(SiteAttendance::getSiteName,
                        LinkedHashMap::new, Collectors.toList()));

        return bySite.entrySet().stream().map(entry -> {
            SiteSummary s = new SiteSummary();
            s.setSiteName(entry.getKey());
            List<SiteAttendance> recs = entry.getValue();
            s.setTotalRecords(recs.size());
            s.setTotalWorkers(recs.stream().mapToInt(SiteAttendance::getTotalWorkers).sum());
            s.setTotalMale(recs.stream().mapToInt(SiteAttendance::getMaleCount).sum());
            s.setTotalFemale(recs.stream().mapToInt(SiteAttendance::getFemaleCount).sum());
            s.setTotalMaleMastri(recs.stream().mapToInt(SiteAttendance::getMaleMastriCount).sum());
            s.setTotalFemaleMastri(recs.stream().mapToInt(SiteAttendance::getFemaleMastriCount).sum());
            s.setTotalMaleHelper(recs.stream().mapToInt(SiteAttendance::getMaleHelperCount).sum());
            s.setTotalFemaleHelper(recs.stream().mapToInt(SiteAttendance::getFemaleHelperCount).sum());
            s.setTotalDays((int) recs.stream()
                    .map(SiteAttendance::getAttendanceDate).distinct().count());
            return s;
        }).toList();
    }

    private List<DateSummary> buildDateSummaries(List<SiteAttendance> records) {
        Map<LocalDate, List<SiteAttendance>> byDate = records.stream()
                .collect(Collectors.groupingBy(SiteAttendance::getAttendanceDate,
                        TreeMap::new, Collectors.toList()));

        return byDate.entrySet().stream().map(entry -> {
            DateSummary d = new DateSummary();
            d.setDate(entry.getKey());
            List<SiteAttendance> recs = entry.getValue();
            d.setTotalRecords(recs.size());
            d.setTotalWorkers(recs.stream().mapToInt(SiteAttendance::getTotalWorkers).sum());
            d.setTotalMale(recs.stream().mapToInt(SiteAttendance::getMaleCount).sum());
            d.setTotalFemale(recs.stream().mapToInt(SiteAttendance::getFemaleCount).sum());
            d.setTotalMaleMastri(recs.stream().mapToInt(SiteAttendance::getMaleMastriCount).sum());
            d.setTotalFemaleMastri(recs.stream().mapToInt(SiteAttendance::getFemaleMastriCount).sum());
            d.setTotalMaleHelper(recs.stream().mapToInt(SiteAttendance::getMaleHelperCount).sum());
            d.setTotalFemaleHelper(recs.stream().mapToInt(SiteAttendance::getFemaleHelperCount).sum());
            d.setSiteCount((int) recs.stream()
                    .map(SiteAttendance::getSiteName).distinct().count());
            return d;
        }).toList();
    }

    private AttendanceRecordDto toRecordDto(SiteAttendance a) {
        AttendanceRecordDto dto = new AttendanceRecordDto();
        dto.setId(a.getId());
        dto.setAttendanceDate(a.getAttendanceDate());
        dto.setSiteName(a.getSiteName());
        dto.setTotalWorkers(a.getTotalWorkers());
        dto.setMaleCount(a.getMaleCount());
        dto.setFemaleCount(a.getFemaleCount());
        dto.setMaleMastriCount(a.getMaleMastriCount());
        dto.setFemaleMastriCount(a.getFemaleMastriCount());
        dto.setMaleHelperCount(a.getMaleHelperCount());
        dto.setFemaleHelperCount(a.getFemaleHelperCount());
        dto.setRemarks(a.getRemarks());
        dto.setStatus(a.getStatus());
        if (a.getSubmittedBy() != null) {
            dto.setSubmittedByName(a.getSubmittedBy().getFirstName() + " " + a.getSubmittedBy().getLastName());
        }
        if (a.getApprover() != null) {
            dto.setApproverName(a.getApprover().getFirstName() + " " + a.getApprover().getLastName());
        }
        if (a.getApprovedAt() != null) {
            dto.setApprovedDate(a.getApprovedAt().toLocalDate());
        }
        dto.setImageBase64(a.getImageBase64());
        dto.setCapturedAt(a.getCreatedAt());
        return dto;
    }
}
