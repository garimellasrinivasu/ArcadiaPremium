package com.arcadia.premium.service;

import com.arcadia.premium.model.Project;
import com.arcadia.premium.repository.ProjectRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class DailyExportScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyExportScheduler.class);

    private final InvoiceBookService invoiceBookService;
    private final EmailService emailService;
    private final ProjectRepository projectRepository;

    @Value("${app.daily-export.recipient-email:}")
    private String recipientEmail;

    public DailyExportScheduler(InvoiceBookService invoiceBookService,
                                 EmailService emailService,
                                 ProjectRepository projectRepository) {
        this.invoiceBookService = invoiceBookService;
        this.emailService = emailService;
        this.projectRepository = projectRepository;
    }

    /**
     * Runs every day at 11:00 PM (23:00).
     * Generates a multi-sheet Excel workbook and emails it to the configured recipient.
     */
    @Scheduled(cron = "0 0 23 * * *")
    public void exportDailyReport() {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.debug("Daily export skipped: no recipient email configured (app.daily-export.recipient-email)");
            return;
        }

        log.info("Starting daily export at 23:00 for recipient: {}", recipientEmail);

        try {
            byte[] excelBytes = generateDailyWorkbook();
            String todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy"));
            String filename = "DailyExport_" + todayStr + ".xlsx";
            String subject = "ArcadiaPremium - Daily Export Report - " + todayStr;
            String body = "Dear Team,\n\n" +
                    "Please find attached the daily export report for " + todayStr + ".\n\n" +
                    "This report contains:\n" +
                    "1. Invoice Entry - All recorded invoice entries\n" +
                    "2. Payment Entry - (Placeholder for future implementation)\n" +
                    "3. Summary - Overview of entries per project\n\n" +
                    "Regards,\n" +
                    "ArcadiaPremium System";

            emailService.sendEmailWithAttachment(recipientEmail, subject, body, excelBytes, filename);
            log.info("Daily export email sent successfully to {}", recipientEmail);

        } catch (Exception e) {
            log.error("Failed to generate/send daily export: {}", e.getMessage(), e);
        }
    }

    /**
     * Generate a workbook with 3 sheets: Invoice Entry, Payment Entry (placeholder), Summary.
     */
    private byte[] generateDailyWorkbook() throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Sheet 1: Invoice Entry
            createInvoiceEntrySheet(workbook);

            // Sheet 2: Payment Entry (placeholder)
            createPaymentEntrySheet(workbook);

            // Sheet 3: Summary
            createSummarySheet(workbook);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void createInvoiceEntrySheet(XSSFWorkbook workbook) {
        // Get all projects and combine their invoice data
        List<Project> projects = projectRepository.findAll();

        Sheet sheet = workbook.createSheet("Invoice Entry");

        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook);

        String[] headers = {"Project", "S.No", "Invoice No", "Supplier/Contractor",
                "Invoice Date", "Material/Work Details", "Invoice Value",
                "Invoice Narration", "Update in Tally", "Entry Mode", "Created By"};

        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

        for (Project project : projects) {
            try {
                var entries = invoiceBookService.list(project.getName());
                for (var e : entries) {
                    Row row = sheet.createRow(rowIdx++);
                    createCell(row, 0, project.getName(), dataStyle);
                    createCell(row, 1, e.getSerialNumber() != null ? String.valueOf(e.getSerialNumber()) : "", dataStyle);
                    createCell(row, 2, e.getInvoiceNo(), dataStyle);
                    createCell(row, 3, e.getSupplierContractorName(), dataStyle);
                    createCell(row, 4, e.getInvoiceDate() != null ? e.getInvoiceDate().format(dateFmt) : "", dataStyle);
                    createCell(row, 5, e.getMaterialWorkDetails(), dataStyle);

                    Cell valCell = row.createCell(6);
                    if (e.getInvoiceValue() != null) valCell.setCellValue(e.getInvoiceValue().doubleValue());
                    valCell.setCellStyle(currencyStyle);

                    createCell(row, 7, e.getInvoiceNarration(), dataStyle);
                    createCell(row, 8, Boolean.TRUE.equals(e.getUpdatedInTally()) ? "Yes" : "No", dataStyle);
                    createCell(row, 9, e.getEntryMode(), dataStyle);
                    createCell(row, 10, e.getCreatedBy(), dataStyle);
                }
            } catch (Exception ex) {
                log.warn("Failed to load invoice entries for project {}: {}", project.getName(), ex.getMessage());
            }
        }

        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void createPaymentEntrySheet(XSSFWorkbook workbook) {
        Sheet sheet = workbook.createSheet("Payment Entry");

        CellStyle headerStyle = createHeaderStyle(workbook);

        String[] headers = {"Project", "Payment No", "Payee", "Amount", "Date", "Mode", "Status"};

        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Placeholder row
        CellStyle dataStyle = createDataStyle(workbook);
        Row row = sheet.createRow(1);
        createCell(row, 0, "-- Payment Entry data will be added in a future update --", dataStyle);

        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void createSummarySheet(XSSFWorkbook workbook) {
        Sheet sheet = workbook.createSheet("Summary");

        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);

        String[] headers = {"Project", "Total Invoice Entries", "Total Invoice Value"};

        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        List<Project> projects = projectRepository.findAll();
        int rowIdx = 1;

        CellStyle currencyStyle = createCurrencyStyle(workbook);

        for (Project project : projects) {
            try {
                var entries = invoiceBookService.list(project.getName());
                Row row = sheet.createRow(rowIdx++);
                createCell(row, 0, project.getName(), dataStyle);

                Cell countCell = row.createCell(1);
                countCell.setCellValue(entries.size());
                countCell.setCellStyle(dataStyle);

                double totalValue = entries.stream()
                        .filter(e -> e.getInvoiceValue() != null)
                        .mapToDouble(e -> e.getInvoiceValue().doubleValue())
                        .sum();
                Cell valCell = row.createCell(2);
                valCell.setCellValue(totalValue);
                valCell.setCellStyle(currencyStyle);
            } catch (Exception ex) {
                log.warn("Failed to get summary for project {}: {}", project.getName(), ex.getMessage());
            }
        }

        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    // ---- Style helpers ----

    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDataStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createCurrencyStyle(XSSFWorkbook workbook) {
        CellStyle style = createDataStyle(workbook);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.00"));
        return style;
    }

    private void createCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }
}
