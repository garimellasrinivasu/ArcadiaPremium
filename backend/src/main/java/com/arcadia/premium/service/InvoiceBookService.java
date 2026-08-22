package com.arcadia.premium.service;

import com.arcadia.premium.dto.InvoiceBookEntryDto;
import com.arcadia.premium.model.InvoiceBookEntry;
import com.arcadia.premium.repository.InvoiceBookEntryRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class InvoiceBookService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceBookService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    private final InvoiceBookEntryRepository repo;

    public InvoiceBookService(InvoiceBookEntryRepository repo) {
        this.repo = repo;
    }

    /**
     * List all entries for a project WITHOUT image data (for performance).
     */
    public List<InvoiceBookEntryDto> list(String projectName) {
        List<Object[]> rows = repo.findAllLightByProjectName(projectName);
        return rows.stream().map(this::mapRowToDto).collect(Collectors.toList());
    }

    /**
     * Get a single entry by ID — includes image data.
     */
    public InvoiceBookEntryDto getById(Long id) {
        InvoiceBookEntry entry = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice entry not found: " + id));
        return InvoiceBookEntryDto.fromEntity(entry);
    }

    /**
     * Create a new invoice entry with auto-generated serial number.
     */
    @Transactional
    public InvoiceBookEntryDto create(InvoiceBookEntryDto dto) {
        InvoiceBookEntry entry = dto.toEntity();

        // Auto-generate serial number (max + 1 per project)
        int nextSerial = repo.findTopByProjectNameOrderBySerialNumberDesc(entry.getProjectName())
                .map(e -> e.getSerialNumber() != null ? e.getSerialNumber() + 1 : 1)
                .orElse(1);
        entry.setSerialNumber(nextSerial);

        InvoiceBookEntry saved = repo.save(entry);
        log.info("Created invoice entry #{} for project {}", saved.getSerialNumber(), saved.getProjectName());
        return InvoiceBookEntryDto.fromEntity(saved);
    }

    /**
     * Update an existing invoice entry.
     */
    @Transactional
    public InvoiceBookEntryDto update(Long id, InvoiceBookEntryDto dto) {
        InvoiceBookEntry entry = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice entry not found: " + id));

        if (dto.getInvoiceNo() != null) entry.setInvoiceNo(dto.getInvoiceNo());
        if (dto.getSupplierContractorName() != null) entry.setSupplierContractorName(dto.getSupplierContractorName());
        if (dto.getInvoiceDate() != null) entry.setInvoiceDate(dto.getInvoiceDate());
        if (dto.getInvoiceValue() != null) entry.setInvoiceValue(dto.getInvoiceValue());
        if (dto.getMaterialWorkDetails() != null) entry.setMaterialWorkDetails(dto.getMaterialWorkDetails());
        if (dto.getInvoiceNarration() != null) entry.setInvoiceNarration(dto.getInvoiceNarration());
        if (dto.getUpdatedInTally() != null) entry.setUpdatedInTally(dto.getUpdatedInTally());
        if (dto.getEntryMode() != null) entry.setEntryMode(dto.getEntryMode());
        if (dto.getInvoiceImageBase64() != null) entry.setInvoiceImageBase64(dto.getInvoiceImageBase64());

        InvoiceBookEntry saved = repo.save(entry);
        log.info("Updated invoice entry id={}", saved.getId());
        return InvoiceBookEntryDto.fromEntity(saved);
    }

    /**
     * Delete an invoice entry.
     */
    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
        log.info("Deleted invoice entry id={}", id);
    }

    /**
     * Extract invoice details from a base64-encoded image using Tesseract CLI.
     * Saves the image to a temp file, runs `tesseract` via ProcessBuilder,
     * and parses the OCR text with regex to find invoice fields.
     * This avoids all JNA/native library issues that tess4j has on macOS ARM.
     */
    public InvoiceBookEntryDto extractFromImage(String base64Image) {
        log.info("Image extraction requested (image length={})", base64Image != null ? base64Image.length() : 0);

        InvoiceBookEntryDto dto = new InvoiceBookEntryDto();
        dto.setEntryMode("IMAGE");
        dto.setInvoiceImageBase64(base64Image);
        dto.setInvoiceDate(LocalDate.now()); // default fallback

        if (base64Image == null || base64Image.isBlank()) {
            return dto;
        }

        Path tempImage = null;
        try {
            // Strip data URI prefix if present (e.g., "data:image/png;base64,...")
            String rawBase64 = base64Image;
            if (rawBase64.contains(",")) {
                rawBase64 = rawBase64.substring(rawBase64.indexOf(",") + 1);
            }

            // Decode base64 and save to temp file
            byte[] imageBytes = Base64.getDecoder().decode(rawBase64);
            tempImage = Files.createTempFile("invoice_ocr_", ".png");
            Files.write(tempImage, imageBytes);
            log.info("Saved temp image for OCR: {}", tempImage);

            // Run tesseract CLI: tesseract <input> stdout -l eng --psm 6
            ProcessBuilder pb = new ProcessBuilder(
                "tesseract", tempImage.toString(), "stdout", "-l", "eng", "--psm", "6"
            );
            pb.redirectErrorStream(false);
            Process process = pb.start();

            // Read stdout (OCR text)
            String ocrText;
            try (InputStream is = process.getInputStream()) {
                ocrText = new String(is.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
            }

            // Read stderr for any warnings
            String errText;
            try (InputStream es = process.getErrorStream()) {
                errText = new String(es.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
            }

            boolean finished = process.waitFor(30, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.error("Tesseract process timed out after 30s");
                return dto;
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                log.error("Tesseract exited with code {}: {}", exitCode, errText);
                return dto;
            }

            if (!errText.isBlank()) {
                log.debug("Tesseract stderr: {}", errText);
            }

            log.info("OCR extracted {} characters of text", ocrText.length());
            log.debug("OCR text:\n{}", ocrText);

            // Parse extracted text for invoice fields
            parseInvoiceFields(ocrText, dto);

        } catch (IOException e) {
            log.error("Failed to run Tesseract OCR: {}", e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Tesseract process interrupted");
        } catch (Throwable e) {
            log.error("Image extraction error ({}): {}", e.getClass().getSimpleName(), e.getMessage());
        } finally {
            // Clean up temp file
            if (tempImage != null) {
                try { Files.deleteIfExists(tempImage); } catch (IOException ignored) {}
            }
        }

        return dto;
    }

    /**
     * Parse OCR text to extract invoice fields using regex patterns.
     * Handles real-world Indian GST invoices with messy OCR output.
     */
    private void parseInvoiceFields(String text, InvoiceBookEntryDto dto) {
        if (text == null || text.isBlank()) return;

        String normalizedText = text.replaceAll("\\r\\n", "\n");
        log.debug("Parsing invoice fields from {} chars of OCR text", normalizedText.length());

        // ── Invoice Number ──
        // Real Indian invoice numbers always contain "/" or "-" (e.g., NRPPL/26-27/0713, INV-2024-001).
        // OCR jumbles multi-column layouts, so we prioritize the standalone pattern that matches
        // alphanumeric strings with slashes/dashes — most reliable on messy OCR text.
        String invoiceNo = null;
        Pattern[] invoiceNoPatterns = {
            // Standalone alphanumeric/slash/dash pattern — most reliable for messy OCR
            // Must have 2+ letters + slash/dash + digits (e.g., NRPPL/26-27/0713, GST/INV/2024/001)
            Pattern.compile(
                "\\b([A-Z]{2,}[/\\-][0-9]{2}[A-Za-z0-9/\\-]{3,})\\b"
            ),
            // Labeled same-line: "Invoice No. NRPPL/26-27/0713" — value must have slash or dash
            Pattern.compile(
                "(?:Invoice|Inv|'?voice|Bill)\\s*(?:No|Number|#|Num)\\.?[:\\s]+([A-Za-z0-9]+[/\\-][A-Za-z0-9/\\-]+)",
                Pattern.CASE_INSENSITIVE
            ),
            // Table layout: label on one line, value on next line — value must have slash or dash
            Pattern.compile(
                "(?:Invoice|Inv|'?voice|Bill)\\s*(?:No|Number|#|Num)\\.?[^\\n]*\\n\\s*([A-Za-z0-9]+[/\\-][A-Za-z0-9/\\-]+)",
                Pattern.CASE_INSENSITIVE
            ),
        };
        for (Pattern p : invoiceNoPatterns) {
            Matcher m = p.matcher(normalizedText);
            if (m.find()) {
                invoiceNo = m.group(1).trim();
                // Skip GSTIN (15 chars with specific pattern), PAN, CIN, IRN
                if (invoiceNo.length() > 20 || invoiceNo.matches(".*[A-Z]{5}[0-9]{4}[A-Z].*")) {
                    invoiceNo = null;
                    continue;
                }
                dto.setInvoiceNo(invoiceNo);
                log.info("Extracted Invoice No: {}", invoiceNo);
                break;
            }
        }

        // ── Supplier / Vendor Name ──
        // Pattern 1: Labeled (M/s, Vendor, Supplier, From, Seller)
        // Pattern 2: Company name by suffix (PVT LTD, PRIVATE LIMITED, LIMITED, LLP, etc.)
        String supplier = null;
        Pattern[] supplierPatterns = {
            // Labeled pattern
            Pattern.compile(
                "(?:M/s\\.?|Vendor|Supplier|From|Seller|Company)[:\\s]+([A-Za-z][A-Za-z .&,()]+)",
                Pattern.CASE_INSENSITIVE
            ),
            // Company suffix detection — matches a line/phrase ending with PVT LTD, PRIVATE LIMITED, etc.
            Pattern.compile(
                "([A-Z][A-Z .&]+(?:PVT\\.?\\s*LTD|PRIVATE\\s+LIMITED|LIMITED|LLP|INC|CORP))\\.?",
                Pattern.CASE_INSENSITIVE
            ),
        };
        for (Pattern p : supplierPatterns) {
            Matcher m = p.matcher(normalizedText);
            if (m.find()) {
                supplier = m.group(1).trim().replaceAll("[,.:]+$", "").trim();
                // Skip if too short or looks like the buyer (PRANEETH ARCADIA = our company)
                if (supplier.length() > 3 && !supplier.toUpperCase().contains("PRANEETH")
                        && !supplier.toUpperCase().contains("ARCADIA")) {
                    dto.setSupplierContractorName(supplier);
                    log.info("Extracted Supplier: {}", supplier);
                    break;
                }
                supplier = null;
            }
        }

        // ── Invoice Date ──
        // Look for date near "Date", "Dt", "Dated", "Ack Date" labels
        // Also handle dates in parentheses like "(18-Aug-26)"
        Pattern[] datePatterns = {
            // Labeled date with dd/mm/yyyy or dd-mm-yyyy
            Pattern.compile("(?:Invoice\\s*Date|Ack\\s*Date|Date|Dt|Dated)[.:\\s]*([0-9]{1,2}[/\\-.][0-9]{1,2}[/\\-.][0-9]{2,4})", Pattern.CASE_INSENSITIVE),
            // Labeled date with dd-Mon-yy or dd Mon yyyy (e.g., "18-Aug-26", "15 Jan 2024")
            Pattern.compile("(?:Invoice\\s*Date|Ack\\s*Date|Date|Dt|Dated)[.:\\s]*([0-9]{1,2}[\\s\\-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\s\\-][0-9]{2,4})", Pattern.CASE_INSENSITIVE),
            // Date in parentheses — e.g., "(18-Aug-26"
            Pattern.compile("\\(([0-9]{1,2}[\\-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\-][0-9]{2,4})", Pattern.CASE_INSENSITIVE),
            // Standalone dd/mm/yyyy or dd-mm-yyyy
            Pattern.compile("\\b([0-9]{1,2}[/\\-.][0-9]{1,2}[/\\-.][0-9]{4})\\b"),
            // Standalone dd-Mon-yy or dd-Mon-yyyy
            Pattern.compile("\\b([0-9]{1,2}[\\-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\-][0-9]{2,4})\\b", Pattern.CASE_INSENSITIVE),
        };
        for (Pattern dp : datePatterns) {
            Matcher m = dp.matcher(normalizedText);
            if (m.find()) {
                String dateStr = m.group(1).trim().replaceAll("[()]+", "");
                LocalDate parsedDate = tryParseDate(dateStr);
                if (parsedDate != null) {
                    dto.setInvoiceDate(parsedDate);
                    log.info("Extracted Date: {}", dto.getInvoiceDate());
                    break;
                }
            }
        }

        // ── Invoice Value / Total Amount ──
        // Indian number format: 5,43,609.00 (lakh style) or 1,23,45,678.00
        // The number MUST have a comma or decimal (to skip HSN codes like 251710, PINs, etc.)
        String indianAmtRegex = "([0-9]{1,3},[0-9]{2,3}(?:,[0-9]{2,3})*(?:\\.[0-9]{1,2})?)";
        // Common currency prefixes: Rs, Rs., IRs, INR, ₹ (OCR may garble these)
        String currencyPrefix = "(?:I?Rs\\.?|₹|INR)";

        Pattern[] amountPatterns = {
            // "Amount Chargeable" — most reliable for GST invoices
            Pattern.compile("Amount\\s*Chargeable[^0-9]*" + indianAmtRegex, Pattern.CASE_INSENSITIVE),
            // Grand Total, Total Amount, Net Amount, Net Payable
            Pattern.compile("(?:Grand\\s*Total|Total\\s*Amount|Net\\s*Amount|Net\\s*Payable)[^0-9]*" + indianAmtRegex, Pattern.CASE_INSENSITIVE),
            // "Total" followed by separator and amount
            Pattern.compile("\\bTotal[^A-Za-z0-9]*" + currencyPrefix + "?\\s*" + indianAmtRegex, Pattern.CASE_INSENSITIVE),
            // WR or similar OCR garble of INR (e.g., "[WR 5,43,609.00")
            Pattern.compile("(?:\\[?WR|\\[?NR)\\s*" + indianAmtRegex, Pattern.CASE_INSENSITIVE),
            // Currency prefix + amount (lower priority — can match noise)
            Pattern.compile(currencyPrefix + "\\s*" + indianAmtRegex, Pattern.CASE_INSENSITIVE),
        };
        // Try ALL patterns and keep the GLOBAL maximum — don't break early.
        // This ensures we find the largest amount even if an earlier pattern matches noise.
        BigDecimal maxAmount = BigDecimal.ZERO;
        for (Pattern ap : amountPatterns) {
            Matcher m = ap.matcher(normalizedText);
            while (m.find()) {
                try {
                    String amountStr = m.group(1).replaceAll(",", "").trim();
                    BigDecimal amount = new BigDecimal(amountStr);
                    if (amount.compareTo(maxAmount) > 0) {
                        maxAmount = amount;
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        // Minimum threshold: real invoice totals are almost always > ₹999
        if (maxAmount.compareTo(new BigDecimal("999")) > 0) {
            dto.setInvoiceValue(maxAmount);
            log.info("Extracted Amount: {}", dto.getInvoiceValue());
        }

        // ── Material / Work Details ──
        // Look for actual line items (not the column header).
        // Common construction materials: SAND, AGGREGATE, CEMENT, STEEL, TMT, BRICK, etc.
        // Also look for labeled descriptions.
        StringBuilder items = new StringBuilder();

        // First try: Extract actual line items containing material keywords
        Pattern itemPattern = Pattern.compile(
            "(?:^|\\n)\\s*\\d+[./\\s]*(.*?(?:SAND|AGGREGATE|CEMENT|STEEL|TMT|BRICK|PIPE|TILE|PAINT|PUTTY|PLASTER|PLYWOOD|WOOD|IRON|CONCRETE|RMC|HARDWARE|ELECTRICAL|PLUMBING|LABOUR|LABOR|WORK|MATERIAL)[^\\n]*)",
            Pattern.CASE_INSENSITIVE
        );
        Matcher m = itemPattern.matcher(normalizedText);
        int itemCount = 0;
        while (m.find() && itemCount < 5) {
            String item = m.group(1).trim()
                .replaceAll("\\s*\\|.*", "")           // Remove everything after pipe
                .replaceAll("\\s+\\d{4,}.*", "")       // Remove HSN codes (4+ digit numbers) and everything after
                .replaceAll("\\s+[0-9,.]+\\s*MT.*", "") // Remove quantity/rate suffixes
                .replaceAll("\\s+[0-9,.]+\\s*%.*", "")  // Remove GST rate suffixes
                .replaceAll("\\s{2,}", " ")             // Collapse multiple spaces
                .trim();
            if (item.length() > 3
                    && !item.toUpperCase().contains("HSN")
                    && !item.toUpperCase().contains("RATE PER")
                    && !item.toUpperCase().contains("INTERST")
                    && !item.toUpperCase().contains("JURISDICTION")
                    && !item.toUpperCase().contains("OVERDUE")) {
                if (items.length() > 0) items.append(", ");
                items.append(item);
                itemCount++;
            }
        }

        // Fallback: labeled description (Particulars, Subject, For)
        if (items.length() == 0) {
            Pattern descPattern = Pattern.compile(
                "(?:Particulars|Subject|For\\s+supply|Billing\\s+From)[:\\s]+(.+?)(?:\\n|$)",
                Pattern.CASE_INSENSITIVE
            );
            m = descPattern.matcher(normalizedText);
            if (m.find()) {
                String desc = m.group(1).trim();
                // Skip if it looks like a column header
                if (desc.length() > 2 && !desc.toUpperCase().contains("HSN/SAC")
                        && !desc.toUpperCase().contains("RATE PER")) {
                    items.append(desc);
                }
            }
        }

        // Second fallback: use "Billing From" info
        if (items.length() == 0) {
            Pattern billingPattern = Pattern.compile(
                "Billing\\s+From\\s+([0-9]{1,2}[./\\-][0-9]{1,2}[./\\-][0-9]{2,4})\\s+to\\s+([0-9]{1,2}[./\\-][0-9]{1,2}[./\\-][0-9]{2,4})",
                Pattern.CASE_INSENSITIVE
            );
            m = billingPattern.matcher(normalizedText);
            if (m.find()) {
                items.append("Billing period: ").append(m.group(1)).append(" to ").append(m.group(2));
            }
        }

        if (items.length() > 0) {
            dto.setMaterialWorkDetails(items.toString());
            log.info("Extracted Description: {}", dto.getMaterialWorkDetails());
        }
    }

    /**
     * Try to parse a date string in various Indian/common formats.
     */
    private LocalDate tryParseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        // Clean up common OCR artifacts
        dateStr = dateStr.replaceAll("[()\\[\\]]+", "").trim();

        DateTimeFormatter[] formats = {
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yy"),
            DateTimeFormatter.ofPattern("dd-MM-yy"),
            DateTimeFormatter.ofPattern("d/M/yyyy"),
            DateTimeFormatter.ofPattern("d-M-yyyy"),
            DateTimeFormatter.ofPattern("d/M/yy"),
            DateTimeFormatter.ofPattern("d-M-yy"),
            DateTimeFormatter.ofPattern("dd-MMM-yy"),     // 18-Aug-26
            DateTimeFormatter.ofPattern("dd-MMM-yyyy"),    // 18-Aug-2026
            DateTimeFormatter.ofPattern("dd MMM yy"),      // 18 Aug 26
            DateTimeFormatter.ofPattern("dd MMM yyyy"),    // 18 Aug 2026
            DateTimeFormatter.ofPattern("dd MMMM yyyy"),   // 18 August 2026
            DateTimeFormatter.ofPattern("d-MMM-yy"),       // 8-Aug-26
            DateTimeFormatter.ofPattern("d-MMM-yyyy"),     // 8-Aug-2026
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),     // 2026-08-18
        };
        for (DateTimeFormatter fmt : formats) {
            try {
                return LocalDate.parse(dateStr, fmt);
            } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    /**
     * Export invoice entries for a project to Excel.
     * Uses lightweight query (no image data) to avoid memory issues with large base64 images.
     */
    public byte[] exportToExcel(String projectName) throws IOException {
        // Use the lightweight list (no image data) — export doesn't need images
        List<InvoiceBookEntryDto> entries = list(projectName);

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Invoice Entry");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Data cell style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            // Currency style
            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.cloneStyleFrom(dataStyle);
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0.00"));

            // Headers
            String[] headers = {"S.No", "Invoice No", "Supplier/Contractor", "Invoice Date",
                    "Material/Work Details", "Invoice Value", "Invoice Narration",
                    "Update in Tally", "Entry Mode", "Created By", "Created At"};

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowIdx = 1;
            for (InvoiceBookEntryDto e : entries) {
                Row row = sheet.createRow(rowIdx++);

                Cell c0 = row.createCell(0); c0.setCellValue(e.getSerialNumber() != null ? e.getSerialNumber() : rowIdx - 1); c0.setCellStyle(dataStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(e.getInvoiceNo() != null ? e.getInvoiceNo() : ""); c1.setCellStyle(dataStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(e.getSupplierContractorName() != null ? e.getSupplierContractorName() : ""); c2.setCellStyle(dataStyle);
                Cell c3 = row.createCell(3); c3.setCellValue(e.getInvoiceDate() != null ? e.getInvoiceDate().format(DATE_FMT) : ""); c3.setCellStyle(dataStyle);
                Cell c4 = row.createCell(4); c4.setCellValue(e.getMaterialWorkDetails() != null ? e.getMaterialWorkDetails() : ""); c4.setCellStyle(dataStyle);
                Cell c5 = row.createCell(5);
                if (e.getInvoiceValue() != null) { c5.setCellValue(e.getInvoiceValue().doubleValue()); }
                c5.setCellStyle(currencyStyle);
                Cell c6 = row.createCell(6); c6.setCellValue(e.getInvoiceNarration() != null ? e.getInvoiceNarration() : ""); c6.setCellStyle(dataStyle);
                Cell c7 = row.createCell(7); c7.setCellValue(Boolean.TRUE.equals(e.getUpdatedInTally()) ? "Yes" : "No"); c7.setCellStyle(dataStyle);
                Cell c8 = row.createCell(8); c8.setCellValue(e.getEntryMode() != null ? e.getEntryMode() : "MANUAL"); c8.setCellStyle(dataStyle);
                Cell c9 = row.createCell(9); c9.setCellValue(e.getCreatedBy() != null ? e.getCreatedBy() : ""); c9.setCellStyle(dataStyle);
                Cell c10 = row.createCell(10);
                c10.setCellValue(e.getCreatedAt() != null ? e.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm")) : "");
                c10.setCellStyle(dataStyle);
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Helper to map Object[] from the lightweight projection query to a DTO.
     */
    private InvoiceBookEntryDto mapRowToDto(Object[] row) {
        InvoiceBookEntryDto dto = new InvoiceBookEntryDto();
        dto.setId(row[0] != null ? ((Number) row[0]).longValue() : null);
        dto.setProjectName((String) row[1]);
        dto.setSerialNumber(row[2] != null ? ((Number) row[2]).intValue() : null);
        dto.setInvoiceNo((String) row[3]);
        dto.setSupplierContractorName((String) row[4]);
        dto.setInvoiceDate(row[5] != null ? (LocalDate) row[5] : null);
        dto.setInvoiceValue(row[6] != null ? (BigDecimal) row[6] : null);
        dto.setMaterialWorkDetails((String) row[7]);
        dto.setInvoiceNarration((String) row[8]);
        dto.setUpdatedInTally(row[9] != null ? (Boolean) row[9] : false);
        dto.setEntryMode((String) row[10]);
        dto.setCreatedBy((String) row[11]);
        dto.setCreatedAt(row[12] != null ? (LocalDateTime) row[12] : null);
        dto.setUpdatedAt(row[13] != null ? (LocalDateTime) row[13] : null);
        // invoiceImageBase64 intentionally not included
        return dto;
    }
}
