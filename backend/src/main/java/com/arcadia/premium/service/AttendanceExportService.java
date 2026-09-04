package com.arcadia.premium.service;

import com.arcadia.premium.dto.AttendanceReportDto;
import com.arcadia.premium.dto.AttendanceReportDto.*;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.ClientAnchor;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Drawing;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;

@Service
public class AttendanceExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd-MMM HH:mm");

    // ===================== EXCEL EXPORT =====================

    public byte[] exportToExcel(AttendanceReportDto report) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // ---- Styles ----
            CellStyle headerStyle = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle dataStyle = wb.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            CellStyle totalStyle = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font totalFont = wb.createFont();
            totalFont.setBold(true);
            totalStyle.setFont(totalFont);
            totalStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            totalStyle.setBorderBottom(BorderStyle.THIN);
            totalStyle.setBorderTop(BorderStyle.THIN);
            totalStyle.setBorderLeft(BorderStyle.THIN);
            totalStyle.setBorderRight(BorderStyle.THIN);

            CellStyle titleStyle = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            // ---- Sheet 1: Site-wise Summary ----
            Sheet siteSummarySheet = wb.createSheet("Site Summary");
            int row = 0;

            Row titleRow = siteSummarySheet.createRow(row++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Site Attendance Report - Site Summary");
            titleCell.setCellStyle(titleStyle);
            siteSummarySheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

            Row dateRow = siteSummarySheet.createRow(row++);
            dateRow.createCell(0).setCellValue("Period: " +
                    report.getFromDate().format(DATE_FMT) + " to " + report.getToDate().format(DATE_FMT));
            row++; // blank row

            String[] siteHeaders = {"Site Name", "Records", "Total Workers", "M-Mastri", "F-Mastri", "M-Helper", "F-Helper", "Days"};
            Row siteHeaderRow = siteSummarySheet.createRow(row++);
            for (int i = 0; i < siteHeaders.length; i++) {
                Cell c = siteHeaderRow.createCell(i);
                c.setCellValue(siteHeaders[i]);
                c.setCellStyle(headerStyle);
            }

            for (SiteSummary s : report.getSiteSummaries()) {
                Row r = siteSummarySheet.createRow(row++);
                createDataCell(r, 0, s.getSiteName(), dataStyle);
                createDataCell(r, 1, s.getTotalRecords(), dataStyle);
                createDataCell(r, 2, s.getTotalWorkers(), dataStyle);
                createDataCell(r, 3, s.getTotalMaleMastri(), dataStyle);
                createDataCell(r, 4, s.getTotalFemaleMastri(), dataStyle);
                createDataCell(r, 5, s.getTotalMaleHelper(), dataStyle);
                createDataCell(r, 6, s.getTotalFemaleHelper(), dataStyle);
                createDataCell(r, 7, s.getTotalDays(), dataStyle);
            }

            // Totals row
            Row siteTotalRow = siteSummarySheet.createRow(row++);
            createDataCell(siteTotalRow, 0, "TOTAL", totalStyle);
            createDataCell(siteTotalRow, 1, report.getTotalRecords(), totalStyle);
            createDataCell(siteTotalRow, 2, report.getTotalWorkers(), totalStyle);
            createDataCell(siteTotalRow, 3, report.getTotalMaleMastri(), totalStyle);
            createDataCell(siteTotalRow, 4, report.getTotalFemaleMastri(), totalStyle);
            createDataCell(siteTotalRow, 5, report.getTotalMaleHelper(), totalStyle);
            createDataCell(siteTotalRow, 6, report.getTotalFemaleHelper(), totalStyle);
            createDataCell(siteTotalRow, 7, report.getTotalDays(), totalStyle);

            for (int i = 0; i < siteHeaders.length; i++) siteSummarySheet.autoSizeColumn(i);

            // ---- Sheet 2: Date-wise Summary ----
            Sheet dateSummarySheet = wb.createSheet("Date Summary");
            row = 0;

            titleRow = dateSummarySheet.createRow(row++);
            titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Site Attendance Report - Date Summary");
            titleCell.setCellStyle(titleStyle);
            dateSummarySheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

            dateRow = dateSummarySheet.createRow(row++);
            dateRow.createCell(0).setCellValue("Period: " +
                    report.getFromDate().format(DATE_FMT) + " to " + report.getToDate().format(DATE_FMT));
            row++;

            String[] dateHeaders = {"Date", "Sites", "Records", "Total Workers", "M-Mastri", "F-Mastri", "M-Helper", "F-Helper"};
            Row dateHeaderRow = dateSummarySheet.createRow(row++);
            for (int i = 0; i < dateHeaders.length; i++) {
                Cell c = dateHeaderRow.createCell(i);
                c.setCellValue(dateHeaders[i]);
                c.setCellStyle(headerStyle);
            }

            for (DateSummary d : report.getDateSummaries()) {
                Row r = dateSummarySheet.createRow(row++);
                createDataCell(r, 0, d.getDate().format(DATE_FMT), dataStyle);
                createDataCell(r, 1, d.getSiteCount(), dataStyle);
                createDataCell(r, 2, d.getTotalRecords(), dataStyle);
                createDataCell(r, 3, d.getTotalWorkers(), dataStyle);
                createDataCell(r, 4, d.getTotalMaleMastri(), dataStyle);
                createDataCell(r, 5, d.getTotalFemaleMastri(), dataStyle);
                createDataCell(r, 6, d.getTotalMaleHelper(), dataStyle);
                createDataCell(r, 7, d.getTotalFemaleHelper(), dataStyle);
            }

            Row dateTotalRow = dateSummarySheet.createRow(row++);
            createDataCell(dateTotalRow, 0, "TOTAL", totalStyle);
            createDataCell(dateTotalRow, 1, "", totalStyle);
            createDataCell(dateTotalRow, 2, report.getTotalRecords(), totalStyle);
            createDataCell(dateTotalRow, 3, report.getTotalWorkers(), totalStyle);
            createDataCell(dateTotalRow, 4, report.getTotalMaleMastri(), totalStyle);
            createDataCell(dateTotalRow, 5, report.getTotalFemaleMastri(), totalStyle);
            createDataCell(dateTotalRow, 6, report.getTotalMaleHelper(), totalStyle);
            createDataCell(dateTotalRow, 7, report.getTotalFemaleHelper(), totalStyle);

            for (int i = 0; i < dateHeaders.length; i++) dateSummarySheet.autoSizeColumn(i);

            // ---- Sheet 3: Detail Records ----
            Sheet detailSheet = wb.createSheet("Detail Records");
            Drawing<?> drawing = detailSheet.createDrawingPatriarch();
            CreationHelper helper = wb.getCreationHelper();
            row = 0;

            titleRow = detailSheet.createRow(row++);
            titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Site Attendance Report - Detail Records");
            titleCell.setCellStyle(titleStyle);
            detailSheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 16));

            dateRow = detailSheet.createRow(row++);
            dateRow.createCell(0).setCellValue("Period: " +
                    report.getFromDate().format(DATE_FMT) + " to " + report.getToDate().format(DATE_FMT));
            row++;

            String[] detailHeaders = {"Photo", "Date", "Captured At", "Site Name", "Work Type", "Mastri Leader", "Submitted By", "Submitted At", "Total Workers", "M-Mastri", "F-Mastri", "M-Helper", "F-Helper", "Status", "Remarks", "Approved By", "Approved At"};
            Row detailHeaderRow = detailSheet.createRow(row++);
            for (int i = 0; i < detailHeaders.length; i++) {
                Cell c = detailHeaderRow.createCell(i);
                c.setCellValue(detailHeaders[i]);
                c.setCellStyle(headerStyle);
            }

            // Set photo column width (~80px = ~11 chars width)
            detailSheet.setColumnWidth(0, 3500);

            for (AttendanceRecordDto rec : report.getRecords()) {
                Row r = detailSheet.createRow(row);
                // Set row height for image (~60px = 45 points)
                r.setHeightInPoints(55);

                // Column 0: Photo
                createDataCell(r, 0, "", dataStyle);
                if (rec.getImageBase64() != null && !rec.getImageBase64().isEmpty()) {
                    try {
                        byte[] imgBytes = decodeBase64Image(rec.getImageBase64());
                        if (imgBytes != null && imgBytes.length > 0) {
                            int pictureIdx = wb.addPicture(imgBytes, getPictureType(rec.getImageBase64()));
                            ClientAnchor anchor = helper.createClientAnchor();
                            anchor.setCol1(0);
                            anchor.setRow1(row);
                            anchor.setCol2(1);
                            anchor.setRow2(row + 1);
                            anchor.setAnchorType(ClientAnchor.AnchorType.MOVE_AND_RESIZE);
                            drawing.createPicture(anchor, pictureIdx);
                        }
                    } catch (Exception ignored) {
                        // Skip image if decoding fails
                    }
                }

                createDataCell(r, 1, rec.getAttendanceDate().format(DATE_FMT), dataStyle);
                createDataCell(r, 2, rec.getCapturedAt() != null ? rec.getCapturedAt().format(DATETIME_FMT) : "", dataStyle);
                createDataCell(r, 3, rec.getSiteName(), dataStyle);
                createDataCell(r, 4, rec.getAttendanceType() != null ? rec.getAttendanceType() : "REGULAR", dataStyle);
                createDataCell(r, 5, rec.getMastriLeaderName() != null ? rec.getMastriLeaderName() : "", dataStyle);
                createDataCell(r, 6, rec.getSubmittedByName() != null ? rec.getSubmittedByName() : "", dataStyle);
                createDataCell(r, 7, rec.getSubmittedAt() != null ? rec.getSubmittedAt().format(DATETIME_FMT) : "", dataStyle);
                createDataCell(r, 8, rec.getTotalWorkers(), dataStyle);
                createDataCell(r, 9, rec.getMaleMastriCount(), dataStyle);
                createDataCell(r, 10, rec.getFemaleMastriCount(), dataStyle);
                createDataCell(r, 11, rec.getMaleHelperCount(), dataStyle);
                createDataCell(r, 12, rec.getFemaleHelperCount(), dataStyle);
                createDataCell(r, 13, rec.getStatus() != null ? ("APPROVED".equals(rec.getStatus()) ? "Approved" : "REJECTED".equals(rec.getStatus()) ? "Rejected" : "Pending") : "", dataStyle);
                createDataCell(r, 14, rec.getRemarks() != null ? rec.getRemarks() : "", dataStyle);
                createDataCell(r, 15, rec.getApproverName() != null ? rec.getApproverName() : "", dataStyle);
                createDataCell(r, 16, rec.getApprovedAt() != null ? rec.getApprovedAt().format(DATETIME_FMT) : "", dataStyle);
                row++;
            }

            // Auto-size all columns except photo (col 0, already set)
            for (int i = 1; i < detailHeaders.length; i++) detailSheet.autoSizeColumn(i);

            wb.write(out);
            return out.toByteArray();
        }
    }

    private void createDataCell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value != null ? value : "");
        c.setCellStyle(style);
    }

    private void createDataCell(Row row, int col, int value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value);
        c.setCellStyle(style);
    }

    // ===================== PDF EXPORT =====================

    public byte[] exportToPdf(AttendanceReportDto report) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate());

        try {
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD, new Color(30, 80, 150));
            Font headerFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
            Font dataFont = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.BLACK);
            Font totalFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.BLACK);
            Font subtitleFont = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(80, 80, 80));

            String period = "Period: " + report.getFromDate().format(DATE_FMT) +
                    " to " + report.getToDate().format(DATE_FMT);

            // ---- Site Summary ----
            doc.add(new Paragraph("Site Attendance Report - Site Summary", titleFont));
            doc.add(new Paragraph(period, subtitleFont));
            doc.add(new Paragraph(" "));

            PdfPTable siteTable = new PdfPTable(new float[]{3f, 1f, 1.5f, 1f, 1f, 1f, 1f, 1f});
            siteTable.setWidthPercentage(100);

            addPdfHeader(siteTable, headerFont, "Site Name", "Records", "Total Workers", "M-Mastri", "F-Mastri", "M-Helper", "F-Helper", "Days");
            for (SiteSummary s : report.getSiteSummaries()) {
                addPdfRow(siteTable, dataFont, s.getSiteName(),
                        String.valueOf(s.getTotalRecords()), String.valueOf(s.getTotalWorkers()),
                        String.valueOf(s.getTotalMaleMastri()), String.valueOf(s.getTotalFemaleMastri()),
                        String.valueOf(s.getTotalMaleHelper()), String.valueOf(s.getTotalFemaleHelper()),
                        String.valueOf(s.getTotalDays()));
            }
            addPdfTotalRow(siteTable, totalFont, "TOTAL",
                    String.valueOf(report.getTotalRecords()), String.valueOf(report.getTotalWorkers()),
                    String.valueOf(report.getTotalMaleMastri()), String.valueOf(report.getTotalFemaleMastri()),
                    String.valueOf(report.getTotalMaleHelper()), String.valueOf(report.getTotalFemaleHelper()),
                    String.valueOf(report.getTotalDays()));
            doc.add(siteTable);

            // ---- Date Summary (new page) ----
            doc.newPage();
            doc.add(new Paragraph("Site Attendance Report - Date Summary", titleFont));
            doc.add(new Paragraph(period, subtitleFont));
            doc.add(new Paragraph(" "));

            PdfPTable dateTable = new PdfPTable(new float[]{2f, 1f, 1f, 1.5f, 1f, 1f, 1f, 1f});
            dateTable.setWidthPercentage(100);

            addPdfHeader(dateTable, headerFont, "Date", "Sites", "Records", "Total Workers", "M-Mastri", "F-Mastri", "M-Helper", "F-Helper");
            for (DateSummary d : report.getDateSummaries()) {
                addPdfRow(dateTable, dataFont, d.getDate().format(DATE_FMT),
                        String.valueOf(d.getSiteCount()), String.valueOf(d.getTotalRecords()),
                        String.valueOf(d.getTotalWorkers()), String.valueOf(d.getTotalMaleMastri()),
                        String.valueOf(d.getTotalFemaleMastri()), String.valueOf(d.getTotalMaleHelper()),
                        String.valueOf(d.getTotalFemaleHelper()));
            }
            addPdfTotalRow(dateTable, totalFont, "TOTAL", "",
                    String.valueOf(report.getTotalRecords()), String.valueOf(report.getTotalWorkers()),
                    String.valueOf(report.getTotalMaleMastri()), String.valueOf(report.getTotalFemaleMastri()),
                    String.valueOf(report.getTotalMaleHelper()), String.valueOf(report.getTotalFemaleHelper()));
            doc.add(dateTable);

            // ---- Detail Records (new page) ----
            doc.newPage();
            doc.add(new Paragraph("Site Attendance Report - Detail Records", titleFont));
            doc.add(new Paragraph(period, subtitleFont));
            doc.add(new Paragraph(" "));

            PdfPTable detailTable = new PdfPTable(new float[]{1.1f, 1f, 0.9f, 1.3f, 0.8f, 1.1f, 1.1f, 1f, 0.6f, 0.6f, 0.6f, 0.6f, 0.6f, 0.7f, 1.1f, 1.1f, 1f});
            detailTable.setWidthPercentage(100);

            addPdfHeader(detailTable, headerFont, "Photo", "Date", "Captured", "Site", "Work Type", "Mastri Leader", "Submitted By", "Submitted At", "Total", "M-Mastri", "F-Mastri", "M-Helper", "F-Helper", "Status", "Remarks", "Approved By", "Approved At");
            for (AttendanceRecordDto rec : report.getRecords()) {
                String statusLabel = rec.getStatus() != null
                        ? ("APPROVED".equals(rec.getStatus()) ? "Approved" : "REJECTED".equals(rec.getStatus()) ? "Rejected" : "Pending")
                        : "";

                // Photo cell
                PdfPCell photoCell = new PdfPCell();
                photoCell.setPadding(2);
                photoCell.setFixedHeight(50);
                if (rec.getImageBase64() != null && !rec.getImageBase64().isEmpty()) {
                    try {
                        byte[] imgBytes = decodeBase64Image(rec.getImageBase64());
                        if (imgBytes != null && imgBytes.length > 0) {
                            com.lowagie.text.Image img = com.lowagie.text.Image.getInstance(imgBytes);
                            img.scaleToFit(45, 45);
                            photoCell.setImage(img);
                            photoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                            photoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                        }
                    } catch (Exception ignored) {
                        photoCell.setPhrase(new Phrase("-", dataFont));
                    }
                } else {
                    photoCell.setPhrase(new Phrase("-", dataFont));
                }
                detailTable.addCell(photoCell);

                // Remaining data cells
                addPdfRow(detailTable, dataFont,
                        rec.getAttendanceDate().format(DATE_FMT),
                        rec.getCapturedAt() != null ? rec.getCapturedAt().format(DATETIME_FMT) : "",
                        rec.getSiteName(),
                        rec.getAttendanceType() != null ? rec.getAttendanceType() : "REGULAR",
                        rec.getMastriLeaderName() != null ? rec.getMastriLeaderName() : "",
                        rec.getSubmittedByName() != null ? rec.getSubmittedByName() : "",
                        rec.getSubmittedAt() != null ? rec.getSubmittedAt().format(DATETIME_FMT) : "",
                        String.valueOf(rec.getTotalWorkers()),
                        String.valueOf(rec.getMaleMastriCount()),
                        String.valueOf(rec.getFemaleMastriCount()),
                        String.valueOf(rec.getMaleHelperCount()),
                        String.valueOf(rec.getFemaleHelperCount()),
                        statusLabel,
                        rec.getRemarks() != null ? rec.getRemarks() : "",
                        rec.getApproverName() != null ? rec.getApproverName() : "",
                        rec.getApprovedAt() != null ? rec.getApprovedAt().format(DATETIME_FMT) : "");
            }
            doc.add(detailTable);

        } catch (DocumentException e) {
            throw new RuntimeException("Failed to generate PDF", e);
        } finally {
            doc.close();
        }

        return out.toByteArray();
    }

    private void addPdfHeader(PdfPTable table, Font font, String... headers) {
        Color headerBg = new Color(30, 80, 150);
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, font));
            cell.setBackgroundColor(headerBg);
            cell.setPadding(5);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
    }

    private void addPdfRow(PdfPTable table, Font font, String... values) {
        for (String v : values) {
            PdfPCell cell = new PdfPCell(new Phrase(v, font));
            cell.setPadding(4);
            table.addCell(cell);
        }
    }

    private void addPdfTotalRow(PdfPTable table, Font font, String... values) {
        Color totalBg = new Color(255, 255, 220);
        for (String v : values) {
            PdfPCell cell = new PdfPCell(new Phrase(v, font));
            cell.setBackgroundColor(totalBg);
            cell.setPadding(5);
            table.addCell(cell);
        }
    }

    // ===================== IMAGE HELPERS =====================

    /**
     * Decode a base64 data URI (e.g. "data:image/jpeg;base64,/9j/4AAQ...") to raw bytes.
     */
    private byte[] decodeBase64Image(String dataUri) {
        if (dataUri == null || dataUri.isEmpty()) return null;
        String base64Data;
        if (dataUri.contains(",")) {
            base64Data = dataUri.substring(dataUri.indexOf(",") + 1);
        } else {
            base64Data = dataUri;
        }
        return Base64.getDecoder().decode(base64Data);
    }

    /**
     * Determine POI picture type from the data URI mime type.
     */
    private int getPictureType(String dataUri) {
        if (dataUri != null && dataUri.contains("image/png")) {
            return Workbook.PICTURE_TYPE_PNG;
        }
        return Workbook.PICTURE_TYPE_JPEG;
    }
}
