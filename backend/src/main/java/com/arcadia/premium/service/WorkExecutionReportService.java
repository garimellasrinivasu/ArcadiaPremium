package com.arcadia.premium.service;

import com.arcadia.premium.model.VillaConstructionStatus;
import com.arcadia.premium.repository.VillaConstructionStatusRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WorkExecutionReportService {

    private static final Logger log = LoggerFactory.getLogger(WorkExecutionReportService.class);

    private static final String[] PHASES = {
            "EXCAVATION", "PCC_PUTTINGS", "NECK_COLUMNS", "PLINTH_BEAM",
            "BACK_FILLING_COMPACTION", "COLUMNS", "GROUND_FLOOR_SLAB",
            "FIRST_FLOOR_SLAB", "SECOND_FLOOR_SLAB"
    };

    private static final Map<String, String> PHASE_LABELS = new LinkedHashMap<>();
    static {
        PHASE_LABELS.put("EXCAVATION", "Excavation");
        PHASE_LABELS.put("PCC_PUTTINGS", "PCC & Puttings");
        PHASE_LABELS.put("NECK_COLUMNS", "Neck Columns");
        PHASE_LABELS.put("PLINTH_BEAM", "Plinth Beam");
        PHASE_LABELS.put("BACK_FILLING_COMPACTION", "Back Filling & Compaction");
        PHASE_LABELS.put("COLUMNS", "Columns");
        PHASE_LABELS.put("GROUND_FLOOR_SLAB", "Ground Floor Slab");
        PHASE_LABELS.put("FIRST_FLOOR_SLAB", "First Floor Slab");
        PHASE_LABELS.put("SECOND_FLOOR_SLAB", "Second Floor Slab");
    }

    private final VillaConstructionStatusRepository repository;

    public WorkExecutionReportService(VillaConstructionStatusRepository repository) {
        this.repository = repository;
    }

    /**
     * Generate summary data for a project
     */
    public Map<String, Object> generateSummary(String projectName) {
        List<VillaConstructionStatus> allStatuses = repository.findByProjectName(projectName);

        Map<String, List<VillaConstructionStatus>> byPhase = allStatuses.stream()
                .collect(Collectors.groupingBy(VillaConstructionStatus::getPhase));

        List<Map<String, Object>> phaseSummaries = new ArrayList<>();
        int totalCompleted = 0;
        int totalInProgress = 0;
        int totalNotStarted = 0;

        for (String phase : PHASES) {
            List<VillaConstructionStatus> statuses = byPhase.getOrDefault(phase, Collections.emptyList());
            // All phases are single-activity: completed = activity1Done
            long completed = statuses.stream().filter(VillaConstructionStatus::isActivity1Done).count();
            long inProgress = 0; // single-activity phases have no "in progress" state
            long delayed = statuses.stream().filter(s -> {
                LocalDate target = s.getRevisedPlannedDate() != null ? s.getRevisedPlannedDate() : s.getPlannedTargetDate();
                return target != null && target.isBefore(LocalDate.now()) && !s.isActivity1Done();
            }).count();

            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("phase", phase);
            summary.put("phaseLabel", PHASE_LABELS.getOrDefault(phase, phase));
            summary.put("total", statuses.size());
            summary.put("completed", completed);
            summary.put("inProgress", inProgress);
            summary.put("notStarted", statuses.size() - completed);
            summary.put("delayed", delayed);
            phaseSummaries.add(summary);

            totalCompleted += completed;
            totalInProgress += inProgress;
            totalNotStarted += (statuses.size() - completed - inProgress);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("projectName", projectName);
        result.put("reportDate", LocalDate.now().toString());
        result.put("phases", phaseSummaries);
        result.put("totalCompleted", totalCompleted);
        result.put("totalInProgress", totalInProgress);
        result.put("totalNotStarted", totalNotStarted);
        return result;
    }

    /**
     * Generate Excel report
     */
    public byte[] generateExcel(String projectName) {
        List<VillaConstructionStatus> allStatuses = repository.findByProjectName(projectName);
        Map<String, List<VillaConstructionStatus>> byPhase = allStatuses.stream()
                .collect(Collectors.groupingBy(VillaConstructionStatus::getPhase));

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            // Summary sheet
            Sheet summarySheet = workbook.createSheet("Summary");
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row titleRow = summarySheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Work Execution Updates Summary - " + projectName);
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            Row dateRow = summarySheet.createRow(1);
            dateRow.createCell(0).setCellValue("Report Date: " + LocalDate.now().format(fmt));

            String[] summaryHeaders = {"Phase", "Total Villas", "Completed", "In Progress", "Not Started", "Delayed"};
            Row headerRow = summarySheet.createRow(3);
            for (int i = 0; i < summaryHeaders.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(summaryHeaders[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 4;
            for (String phase : PHASES) {
                List<VillaConstructionStatus> statuses = byPhase.getOrDefault(phase, Collections.emptyList());
                // All phases are single-activity: completed = activity1Done
                long completed = statuses.stream().filter(VillaConstructionStatus::isActivity1Done).count();
                long inProgress = 0; // single-activity phases have no "in progress" state
                long delayed = statuses.stream().filter(s -> {
                    LocalDate target = s.getRevisedPlannedDate() != null ? s.getRevisedPlannedDate() : s.getPlannedTargetDate();
                    return target != null && target.isBefore(LocalDate.now()) && !s.isActivity1Done();
                }).count();

                Row row = summarySheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(PHASE_LABELS.getOrDefault(phase, phase));
                row.createCell(1).setCellValue(statuses.size());
                row.createCell(2).setCellValue(completed);
                row.createCell(3).setCellValue(inProgress);
                row.createCell(4).setCellValue(statuses.size() - completed);
                row.createCell(5).setCellValue(delayed);
            }

            for (int i = 0; i < summaryHeaders.length; i++) {
                summarySheet.autoSizeColumn(i);
            }

            // Detail sheet per phase
            for (String phase : PHASES) {
                List<VillaConstructionStatus> statuses = byPhase.getOrDefault(phase, Collections.emptyList());
                if (statuses.isEmpty()) continue;

                String sheetName = PHASE_LABELS.getOrDefault(phase, phase);
                if (sheetName.length() > 31) sheetName = sheetName.substring(0, 31);
                Sheet sheet = workbook.createSheet(sheetName);

                String[] detailHeaders = {"Villa No", "Activity 1", "Activity 2", "Status",
                        "Incharge", "Planned Date", "Revised Date", "Actual Date", "Delay (Days)"};
                Row dHeaderRow = sheet.createRow(0);
                for (int i = 0; i < detailHeaders.length; i++) {
                    Cell cell = dHeaderRow.createCell(i);
                    cell.setCellValue(detailHeaders[i]);
                    cell.setCellStyle(headerStyle);
                }

                statuses.sort(Comparator.comparing(VillaConstructionStatus::getVillaNumber));
                int dRowIdx = 1;
                for (VillaConstructionStatus s : statuses) {
                    Row row = sheet.createRow(dRowIdx++);
                    row.createCell(0).setCellValue(s.getVillaNumber());
                    row.createCell(1).setCellValue(s.isActivity1Done() ? "Done" : "Not Done");
                    row.createCell(2).setCellValue(s.isActivity2Done() ? "Done" : "Not Done");

                    // All phases are single-activity: only check activity1Done
                    String status = s.isActivity1Done() ? "Completed" : "Not Started";
                    row.createCell(3).setCellValue(status);
                    row.createCell(4).setCellValue(s.getIncharge() != null ? s.getIncharge() : "");
                    row.createCell(5).setCellValue(s.getPlannedTargetDate() != null ? s.getPlannedTargetDate().format(fmt) : "");
                    row.createCell(6).setCellValue(s.getRevisedPlannedDate() != null ? s.getRevisedPlannedDate().format(fmt) : "");
                    row.createCell(7).setCellValue(s.getActualCompletionDate() != null ? s.getActualCompletionDate().format(fmt) : "");

                    // Calculate delay
                    if (s.getActualCompletionDate() != null && s.getPlannedTargetDate() != null) {
                        LocalDate target = s.getRevisedPlannedDate() != null ? s.getRevisedPlannedDate() : s.getPlannedTargetDate();
                        long days = java.time.temporal.ChronoUnit.DAYS.between(target, s.getActualCompletionDate());
                        row.createCell(8).setCellValue(days);
                    } else {
                        row.createCell(8).setCellValue("");
                    }
                }

                for (int i = 0; i < detailHeaders.length; i++) {
                    sheet.autoSizeColumn(i);
                }
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Excel report: {}", e.getMessage(), e);
            return new byte[0];
        }
    }

    // --- Correct 10-phase definitions (matching frontend) ---
    private static final String[] PHASES_10 = {
            "EXCAVATION", "PCC", "FOOTINGS", "NECK_COLUMNS", "BACK_FILLING_COMPACTION",
            "PLINTH_BEAM", "COLUMNS", "GROUND_FLOOR_SLAB", "FIRST_FLOOR_SLAB", "SECOND_FLOOR_SLAB"
    };

    private static final String[] PHASE_10_LABELS = {
            "Excavation", "PCC", "Footings", "Neck Columns", "Back Filling & Compaction",
            "Plinth Beam", "Columns", "Ground Floor Slab", "First Floor Slab", "Second Floor Slab"
    };

    // --- Cluster definitions ---
    private static final int[] CLUSTER_1 = {
            1,2,3,4,17,18,19,20,21,22,23,24,25,26,55,56,57,58,59,60,61,62,63,64,65,66,67,
            100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,
            149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,
            202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221
    };
    private static final int[] CLUSTER_2 = {
            9,10,11,12,13,14,15,16,27,28,29,30,31,32,49,50,51,52,53,54,
            68,69,70,71,72,73,94,95,96,97,98,99,
            115,116,117,118,119,120,143,144,145,146,147,148,
            167,168,169,170,171,172,173,174,194,195,196,197,198,199,200,201,
            222,223,224,225,226,227,228,229
    };
    private static final int[] CLUSTER_3 = {
            5,6,7,8,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,
            74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93
    };
    private static final int[] CLUSTER_4 = {
            121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,
            175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
            230,231,232,233,234,235,236,237
    };

    private static final Map<Integer, String> VILLA_CLUSTER_MAP = new HashMap<>();
    static {
        for (int v : CLUSTER_1) VILLA_CLUSTER_MAP.put(v, "C1");
        for (int v : CLUSTER_2) VILLA_CLUSTER_MAP.put(v, "C2");
        for (int v : CLUSTER_3) VILLA_CLUSTER_MAP.put(v, "C3");
        for (int v : CLUSTER_4) VILLA_CLUSTER_MAP.put(v, "C4");
    }

    /**
     * Generate Villa-wise Status Excel (1-237) matching the Summary page view.
     * Columns: Villa | Cluster | Excavation | PCC | ... | Second Floor Slab | Status
     */
    public byte[] generateVillaWiseExcel(String projectName) {
        List<VillaConstructionStatus> allStatuses = repository.findByProjectName(projectName);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

        // Build lookup: villaNumber -> phase -> completed (both activities done)
        Map<Integer, Map<String, Boolean>> villaPhaseMap = new HashMap<>();
        for (VillaConstructionStatus s : allStatuses) {
            villaPhaseMap
                    .computeIfAbsent(s.getVillaNumber(), k -> new HashMap<>())
                    .put(s.getPhase(), s.isActivity1Done());
        }

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Villa-wise Status");

            // --- Styles ---
            // Title style
            XSSFCellStyle titleStyle = workbook.createCellStyle();
            XSSFFont titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            titleStyle.setFont(titleFont);

            // Date style
            XSSFCellStyle dateStyle = workbook.createCellStyle();
            XSSFFont dateFont = workbook.createFont();
            dateFont.setFontHeightInPoints((short) 11);
            dateFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            dateStyle.setFont(dateFont);

            // Header style - dark blue bg, white text
            XSSFCellStyle headerStyle = workbook.createCellStyle();
            XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setWrapText(true);

            // Data cell style (centered, bordered)
            XSSFCellStyle dataCellStyle = workbook.createCellStyle();
            dataCellStyle.setAlignment(HorizontalAlignment.CENTER);
            dataCellStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            dataCellStyle.setBorderBottom(BorderStyle.THIN);
            dataCellStyle.setBorderTop(BorderStyle.THIN);
            dataCellStyle.setBorderLeft(BorderStyle.THIN);
            dataCellStyle.setBorderRight(BorderStyle.THIN);
            dataCellStyle.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataCellStyle.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataCellStyle.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataCellStyle.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());

            // Green completed cell style
            XSSFCellStyle greenStyle = workbook.createCellStyle();
            greenStyle.cloneStyleFrom(dataCellStyle);
            greenStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0x22,(byte)0xC5,(byte)0x5E}, null));
            greenStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont greenFont = workbook.createFont();
            greenFont.setColor(IndexedColors.WHITE.getIndex());
            greenFont.setBold(true);
            greenFont.setFontHeightInPoints((short) 11);
            greenStyle.setFont(greenFont);

            // Gray not-started cell style
            XSSFCellStyle grayStyle = workbook.createCellStyle();
            grayStyle.cloneStyleFrom(dataCellStyle);
            grayStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0xF3,(byte)0xF4,(byte)0xF6}, null));
            grayStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Cluster badge styles
            XSSFCellStyle c1Style = workbook.createCellStyle();
            c1Style.cloneStyleFrom(dataCellStyle);
            c1Style.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0xDB,(byte)0xEA,(byte)0xFE}, null));
            c1Style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont c1Font = workbook.createFont();
            c1Font.setColor(new XSSFColor(new byte[]{(byte)0x25,(byte)0x63,(byte)0xEB}, null));
            c1Font.setBold(true);
            c1Font.setFontHeightInPoints((short) 10);
            c1Style.setFont(c1Font);

            XSSFCellStyle c2Style = workbook.createCellStyle();
            c2Style.cloneStyleFrom(dataCellStyle);
            c2Style.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0xFE,(byte)0xF3,(byte)0xC7}, null));
            c2Style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont c2Font = workbook.createFont();
            c2Font.setColor(new XSSFColor(new byte[]{(byte)0xD9,(byte)0x77,(byte)0x06}, null));
            c2Font.setBold(true);
            c2Font.setFontHeightInPoints((short) 10);
            c2Style.setFont(c2Font);

            XSSFCellStyle c3Style = workbook.createCellStyle();
            c3Style.cloneStyleFrom(dataCellStyle);
            c3Style.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0xDC,(byte)0xFC,(byte)0xE7}, null));
            c3Style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont c3Font = workbook.createFont();
            c3Font.setColor(new XSSFColor(new byte[]{(byte)0x16,(byte)0xA3,(byte)0x4A}, null));
            c3Font.setBold(true);
            c3Font.setFontHeightInPoints((short) 10);
            c3Style.setFont(c3Font);

            XSSFCellStyle c4Style = workbook.createCellStyle();
            c4Style.cloneStyleFrom(dataCellStyle);
            c4Style.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0xF3,(byte)0xE8,(byte)0xFF}, null));
            c4Style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont c4Font = workbook.createFont();
            c4Font.setColor(new XSSFColor(new byte[]{(byte)0x93,(byte)0x33,(byte)0xEA}, null));
            c4Font.setBold(true);
            c4Font.setFontHeightInPoints((short) 10);
            c4Style.setFont(c4Font);

            // Status column styles
            XSSFCellStyle statusGreenStyle = workbook.createCellStyle();
            statusGreenStyle.cloneStyleFrom(dataCellStyle);
            XSSFFont statusGreenFont = workbook.createFont();
            statusGreenFont.setColor(new XSSFColor(new byte[]{(byte)0x16,(byte)0xA3,(byte)0x4A}, null));
            statusGreenFont.setBold(true);
            statusGreenFont.setFontHeightInPoints((short) 10);
            statusGreenStyle.setFont(statusGreenFont);

            XSSFCellStyle statusOrangeStyle = workbook.createCellStyle();
            statusOrangeStyle.cloneStyleFrom(dataCellStyle);
            XSSFFont statusOrangeFont = workbook.createFont();
            statusOrangeFont.setColor(new XSSFColor(new byte[]{(byte)0xD9,(byte)0x77,(byte)0x06}, null));
            statusOrangeFont.setBold(true);
            statusOrangeFont.setFontHeightInPoints((short) 10);
            statusOrangeStyle.setFont(statusOrangeFont);

            XSSFCellStyle statusRedStyle = workbook.createCellStyle();
            statusRedStyle.cloneStyleFrom(dataCellStyle);
            XSSFFont statusRedFont = workbook.createFont();
            statusRedFont.setColor(new XSSFColor(new byte[]{(byte)0xDC,(byte)0x26,(byte)0x26}, null));
            statusRedFont.setBold(true);
            statusRedFont.setFontHeightInPoints((short) 10);
            statusRedStyle.setFont(statusRedFont);

            // --- Title row ---
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Villa-wise Status (1 – 237) — " + projectName);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));

            // Date row
            Row dateRow = sheet.createRow(1);
            Cell dateCell = dateRow.createCell(0);
            dateCell.setCellValue("Report Date: " + LocalDate.now().format(fmt));
            dateCell.setCellStyle(dateStyle);

            // --- Header row ---
            Row headerRow = sheet.createRow(3);
            headerRow.setHeightInPoints(35);
            String[] headers = new String[13]; // Villa, Cluster, 10 phases, Status
            headers[0] = "Villa";
            headers[1] = "Cluster";
            for (int i = 0; i < 10; i++) {
                headers[i + 2] = PHASE_10_LABELS[i];
            }
            headers[12] = "Status";

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // --- Data rows (Villa 1 to 237) ---
            for (int villa = 1; villa <= 237; villa++) {
                Row row = sheet.createRow(3 + villa);
                Map<String, Boolean> phaseStatus = villaPhaseMap.getOrDefault(villa, Collections.emptyMap());

                // Villa number
                Cell villaCell = row.createCell(0);
                villaCell.setCellValue(villa);
                villaCell.setCellStyle(dataCellStyle);

                // Cluster
                String cluster = VILLA_CLUSTER_MAP.getOrDefault(villa, "");
                Cell clusterCell = row.createCell(1);
                clusterCell.setCellValue(cluster);
                switch (cluster) {
                    case "C1": clusterCell.setCellStyle(c1Style); break;
                    case "C2": clusterCell.setCellStyle(c2Style); break;
                    case "C3": clusterCell.setCellStyle(c3Style); break;
                    case "C4": clusterCell.setCellStyle(c4Style); break;
                    default: clusterCell.setCellStyle(dataCellStyle);
                }

                // Phase columns
                int completedCount = 0;
                for (int p = 0; p < 10; p++) {
                    String phase = PHASES_10[p];
                    boolean done = phaseStatus.getOrDefault(phase, false);
                    Cell phaseCell = row.createCell(p + 2);
                    if (done) {
                        phaseCell.setCellValue("Done");
                        phaseCell.setCellStyle(greenStyle);
                        completedCount++;
                    } else {
                        phaseCell.setCellValue("Not Done");
                        phaseCell.setCellStyle(grayStyle);
                    }
                }

                // Status column (e.g. "3/10")
                Cell statusCell = row.createCell(12);
                statusCell.setCellValue(completedCount + "/10");
                if (completedCount == 10) {
                    statusCell.setCellStyle(statusGreenStyle);
                } else if (completedCount > 0) {
                    statusCell.setCellStyle(statusOrangeStyle);
                } else {
                    statusCell.setCellStyle(statusRedStyle);
                }
            }

            // --- Set column widths ---
            sheet.setColumnWidth(0, 2500);  // Villa
            sheet.setColumnWidth(1, 3000);  // Cluster
            for (int i = 2; i < 12; i++) {
                sheet.setColumnWidth(i, 4500);  // Phase columns
            }
            sheet.setColumnWidth(12, 2500); // Status

            // Freeze header row
            sheet.createFreezePane(0, 4);

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            log.info("Villa-wise status Excel generated: {} villas, {} bytes", 237, bos.size());
            return bos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate villa-wise Excel: {}", e.getMessage(), e);
            return new byte[0];
        }
    }

    /**
     * Generate a text summary suitable for WhatsApp message body or email
     */
    public String generateTextSummary(String projectName) {
        Map<String, Object> summary = generateSummary(projectName);
        StringBuilder sb = new StringBuilder();
        sb.append("*Work Execution Updates Summary*\n");
        sb.append("Project: ").append(projectName).append("\n");
        sb.append("Date: ").append(summary.get("reportDate")).append("\n\n");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> phases = (List<Map<String, Object>>) summary.get("phases");
        for (Map<String, Object> phase : phases) {
            long completed = ((Number) phase.get("completed")).longValue();
            long total = ((Number) phase.get("total")).longValue();
            String emoji = completed == total && total > 0 ? "✅" : completed > 0 ? "🔶" : "⬜";
            sb.append(emoji).append(" ").append(phase.get("phaseLabel")).append(": ")
                    .append(completed).append("/").append(total).append(" completed\n");
        }

        sb.append("\n📊 *Overall:* ")
                .append(summary.get("totalCompleted")).append(" completed, ")
                .append(summary.get("totalInProgress")).append(" in progress, ")
                .append(summary.get("totalNotStarted")).append(" not started");

        return sb.toString();
    }
}
