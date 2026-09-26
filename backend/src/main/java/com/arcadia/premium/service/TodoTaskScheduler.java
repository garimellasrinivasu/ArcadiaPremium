package com.arcadia.premium.service;

import com.arcadia.premium.dto.TodoTaskDto;
import com.arcadia.premium.model.NotificationConfig;
import com.arcadia.premium.model.TodoTask;
import com.arcadia.premium.repository.NotificationConfigRepository;
import com.arcadia.premium.repository.TodoTaskRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.mail.internet.MimeMessage;
import javax.imageio.ImageIO;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.List;

@Component
public class TodoTaskScheduler {

    private static final Logger log = LoggerFactory.getLogger(TodoTaskScheduler.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    // Image table colors (fully qualified to avoid clash with org.apache.poi.ss.usermodel.Color)
    private static final java.awt.Color DARK_BLUE = new java.awt.Color(0, 0, 128);
    private static final java.awt.Color HEADER_BG = new java.awt.Color(0, 0, 128);
    private static final java.awt.Color HEADER_TEXT = java.awt.Color.WHITE;
    private static final java.awt.Color DATA_BG = java.awt.Color.WHITE;
    private static final java.awt.Color DATA_TEXT = new java.awt.Color(30, 30, 30);
    private static final java.awt.Color BORDER_COLOR = new java.awt.Color(180, 180, 180);
    private static final java.awt.Color OVERDUE_BG = new java.awt.Color(255, 255, 200);
    private static final java.awt.Color OVERDUE_TEXT = new java.awt.Color(200, 0, 0);
    private static final java.awt.Color DUE_TODAY_BG = new java.awt.Color(255, 230, 180);
    private static final java.awt.Color ALT_ROW_BG = new java.awt.Color(240, 245, 255);

    private final TodoTaskService todoTaskService;
    private final TodoTaskRepository todoTaskRepo;
    private final NotificationConfigRepository notificationConfigRepo;
    private final JavaMailSender mailSender;
    private final WhatsAppService whatsAppService;

    @Value("${spring.mail.username:noreply@arcadiapremium.com}")
    private String fromAddress;

    public TodoTaskScheduler(TodoTaskService todoTaskService,
                              TodoTaskRepository todoTaskRepo,
                              NotificationConfigRepository notificationConfigRepo,
                              JavaMailSender mailSender,
                              WhatsAppService whatsAppService) {
        this.todoTaskService = todoTaskService;
        this.todoTaskRepo = todoTaskRepo;
        this.notificationConfigRepo = notificationConfigRepo;
        this.mailSender = mailSender;
        this.whatsAppService = whatsAppService;
    }

    // ==================== SCHEDULED JOBS ====================

    /**
     * Daily at 8:00 AM — send task report with inline image + Excel attachment.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public String dailyReminder() {
        log.info("Running daily todo task reminder...");

        todoTaskService.markOverdueTasks();
        LocalDate today = LocalDate.now();

        List<TodoTask> allTasks = todoTaskRepo.findAllByOrderByTargetDateAsc().stream()
                .filter(t -> !"COMPLETED".equals(t.getStatus()))
                .toList();
        List<TodoTask> todaysTasks = todoTaskRepo.findTodaysTasks(today);

        // Generate Excel
        byte[] excelBytes;
        try {
            excelBytes = generateDailyExcel(todaysTasks, allTasks, today);
        } catch (Exception e) {
            log.error("Failed to generate daily Excel: {}", e.getMessage());
            return "Failed to generate Excel: " + e.getMessage();
        }

        // Generate inline images
        byte[] todaysImage = generateTaskTableImage(
                "TODAY'S TARGET TASKS - " + today.format(DATE_FMT),
                new String[]{"S.No", "Task Code", "Title", "Assigned To", "Category", "Priority", "Status", "Project"},
                buildTodaysTaskRows(todaysTasks),
                null // no overdue coloring for today's table
        );
        byte[] allTasksImage = generateTaskTableImage(
                "ALL PENDING & OVERDUE TASKS - " + today.format(DATE_FMT),
                new String[]{"S.No", "Task Code", "Title", "Assigned To", "Category", "Priority", "Status", "Target Date", "Days Left"},
                buildAllTaskRows(allTasks, today),
                buildOverdueFlags(allTasks, today)
        );

        String fileName = "TaskReport_" + today.format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")) + ".xlsx";
        String whatsAppMsg = buildWhatsAppDailySummary(todaysTasks, allTasks, today);

        // Send to configured recipients
        List<NotificationConfig> emailRecipients = notificationConfigRepo.findByConfigTypeAndActive("EMAIL", true);
        List<NotificationConfig> whatsappRecipients = notificationConfigRepo.findByConfigTypeAndActive("WHATSAPP", true);
        List<String> sentTo = new ArrayList<>();

        String htmlBody = buildDailyHtmlBody(todaysTasks.size(), allTasks.size(), today);

        for (NotificationConfig config : emailRecipients) {
            sendHtmlEmailWithImages(config.getRecipientValue(), config.getRecipientName(),
                    "ArcadiaPremium - Daily Task Report (" + today.format(DATE_FMT) + ")",
                    htmlBody, excelBytes, fileName,
                    todaysImage, allTasksImage);
            sentTo.add(config.getRecipientName() + " (" + config.getRecipientValue() + ") [EMAIL]");
        }

        for (NotificationConfig config : whatsappRecipients) {
            sendWhatsApp(config.getRecipientValue(), whatsAppMsg);
            sentTo.add(config.getRecipientName() + " (" + config.getRecipientValue() + ") [WHATSAPP]");
        }

        if (sentTo.isEmpty()) {
            return "No active notification recipients configured. Go to Admin > Notifications to add email/WhatsApp recipients.";
        }

        String summary = "Daily task report sent to " + sentTo.size() + " recipient(s): " + String.join(", ", sentTo)
                + " | Today's tasks: " + todaysTasks.size() + " | Total pending: " + allTasks.size();
        log.info(summary);
        return summary;
    }

    /**
     * Weekly on Monday at 9:00 AM — send weekly summary with inline image + Excel attachment.
     */
    @Scheduled(cron = "0 0 9 * * MON")
    public String weeklySummary() {
        log.info("Running weekly todo task summary...");

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(7);

        List<TodoTaskDto> completedTasks = todoTaskService.getCompletedInRange(weekStart, today);
        List<TodoTaskDto> pendingTasks = todoTaskService.getAllPendingTasks();

        byte[] excelBytes;
        try {
            excelBytes = generateWeeklyExcel(completedTasks, pendingTasks, weekStart, today);
        } catch (Exception e) {
            log.error("Failed to generate weekly Excel: {}", e.getMessage());
            return "Failed to generate Excel: " + e.getMessage();
        }

        // Generate inline images
        byte[] completedImage = generateTaskTableImage(
                "COMPLETED TASKS (" + weekStart.format(DATE_FMT) + " to " + today.format(DATE_FMT) + ")",
                new String[]{"S.No", "Task Code", "Title", "Assigned To", "Category", "Target Date", "Completed", "Status"},
                buildCompletedTaskRows(completedTasks),
                null
        );
        byte[] pendingImage = generateTaskTableImage(
                "PENDING & OVERDUE TASKS",
                new String[]{"S.No", "Task Code", "Title", "Assigned To", "Priority", "Status", "Target Date", "Days Left"},
                buildPendingTaskRows(pendingTasks),
                buildPendingOverdueFlags(pendingTasks)
        );

        String fileName = "WeeklySummary_" + today.format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")) + ".xlsx";
        String whatsAppMsg = buildWhatsAppWeeklySummary(completedTasks, pendingTasks, weekStart, today);

        List<NotificationConfig> emailRecipients = notificationConfigRepo.findByConfigTypeAndActive("EMAIL", true);
        List<NotificationConfig> whatsappRecipients = notificationConfigRepo.findByConfigTypeAndActive("WHATSAPP", true);
        List<String> sentTo = new ArrayList<>();

        String htmlBody = buildWeeklyHtmlBody(completedTasks.size(), pendingTasks.size(), weekStart, today);

        for (NotificationConfig config : emailRecipients) {
            sendHtmlEmailWithImages(config.getRecipientValue(), config.getRecipientName(),
                    "ArcadiaPremium - Weekly Task Summary (" + weekStart.format(DATE_FMT) + " to " + today.format(DATE_FMT) + ")",
                    htmlBody, excelBytes, fileName,
                    completedImage, pendingImage);
            sentTo.add(config.getRecipientName() + " (" + config.getRecipientValue() + ") [EMAIL]");
        }

        for (NotificationConfig config : whatsappRecipients) {
            sendWhatsApp(config.getRecipientValue(), whatsAppMsg);
            sentTo.add(config.getRecipientName() + " (" + config.getRecipientValue() + ") [WHATSAPP]");
        }

        if (sentTo.isEmpty()) {
            return "No active notification recipients configured.";
        }

        String result = "Weekly summary sent to " + sentTo.size() + " recipient(s): " + String.join(", ", sentTo)
                + " | Completed: " + completedTasks.size() + " | Pending: " + pendingTasks.size();
        log.info(result);
        return result;
    }

    // ==================== IMAGE TABLE GENERATION ====================

    /**
     * Generates a PNG image of a table with title, headers, and data rows.
     * @param overdueFlags null or boolean[] per row — true = highlight as overdue/due-today
     */
    private byte[] generateTaskTableImage(String title, String[] headers, String[][] data, int[] overdueFlags) {
        // Calculate column widths based on content
        int padding = 16;
        int rowHeight = 30;
        int headerHeight = 34;
        int titleHeight = 44;

        java.awt.Font titleFont = new java.awt.Font("Arial", java.awt.Font.BOLD, 16);
        java.awt.Font headerFont = new java.awt.Font("Arial", java.awt.Font.BOLD, 12);
        java.awt.Font dataFont = new java.awt.Font("Arial", java.awt.Font.PLAIN, 11);
        java.awt.Font overdueFont = new java.awt.Font("Arial", java.awt.Font.BOLD, 11);

        // Measure column widths using a temp image
        BufferedImage temp = new BufferedImage(1, 1, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gTemp = temp.createGraphics();
        gTemp.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        FontMetrics headerFm = gTemp.getFontMetrics(headerFont);
        FontMetrics dataFm = gTemp.getFontMetrics(dataFont);
        FontMetrics titleFm = gTemp.getFontMetrics(titleFont);

        int[] colWidths = new int[headers.length];
        for (int c = 0; c < headers.length; c++) {
            colWidths[c] = headerFm.stringWidth(headers[c]) + padding * 2;
        }
        for (String[] row : data) {
            for (int c = 0; c < Math.min(row.length, headers.length); c++) {
                int w = dataFm.stringWidth(row[c] != null ? row[c] : "") + padding * 2;
                colWidths[c] = Math.max(colWidths[c], w);
            }
        }
        // Enforce min/max widths
        for (int c = 0; c < colWidths.length; c++) {
            colWidths[c] = Math.max(colWidths[c], 60);
            colWidths[c] = Math.min(colWidths[c], 280);
        }
        gTemp.dispose();

        int totalWidth = 0;
        for (int w : colWidths) totalWidth += w;
        totalWidth = Math.max(totalWidth, titleFm.stringWidth(title) + padding * 4);

        int dataRows = Math.max(data.length, 1);
        int totalHeight = titleHeight + headerHeight + (dataRows * rowHeight) + 10;

        // Create final image
        BufferedImage image = new BufferedImage(totalWidth + 2, totalHeight, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_LCD_HRGB);

        // Background
        g.setColor(java.awt.Color.WHITE);
        g.fillRect(0, 0, totalWidth + 2, totalHeight);

        // Title
        g.setFont(titleFont);
        g.setColor(DARK_BLUE);
        int titleW = g.getFontMetrics().stringWidth(title);
        g.drawString(title, (totalWidth - titleW) / 2, titleHeight - 14);

        // Title underline
        g.setColor(DARK_BLUE);
        g.fillRect(0, titleHeight - 6, totalWidth + 2, 2);

        int y = titleHeight;

        // Header row
        g.setFont(headerFont);
        g.setColor(HEADER_BG);
        g.fillRect(0, y, totalWidth + 2, headerHeight);
        g.setColor(HEADER_TEXT);
        int x = 0;
        for (int c = 0; c < headers.length; c++) {
            int textX = x + padding;
            int textY = y + headerHeight - 10;
            g.drawString(headers[c], textX, textY);
            // Vertical separator
            if (c > 0) {
                g.setColor(new java.awt.Color(50, 50, 150));
                g.drawLine(x, y, x, y + headerHeight);
                g.setColor(HEADER_TEXT);
            }
            x += colWidths[c];
        }
        y += headerHeight;

        // Data rows
        if (data.length == 0) {
            g.setFont(dataFont);
            g.setColor(DATA_TEXT);
            g.drawString("No data available", padding, y + rowHeight - 10);
        } else {
            for (int r = 0; r < data.length; r++) {
                // Row background
                java.awt.Color rowBg = (r % 2 == 1) ? ALT_ROW_BG : DATA_BG;
                java.awt.Color rowText = DATA_TEXT;
                java.awt.Font rowFont = dataFont;

                if (overdueFlags != null && r < overdueFlags.length) {
                    if (overdueFlags[r] == -1) { // overdue
                        rowBg = OVERDUE_BG;
                        rowText = OVERDUE_TEXT;
                        rowFont = overdueFont;
                    } else if (overdueFlags[r] == 0) { // due today
                        rowBg = DUE_TODAY_BG;
                        rowFont = overdueFont;
                    }
                }

                g.setColor(rowBg);
                g.fillRect(0, y, totalWidth + 2, rowHeight);

                // Border line at bottom
                g.setColor(BORDER_COLOR);
                g.drawLine(0, y + rowHeight - 1, totalWidth + 1, y + rowHeight - 1);

                g.setFont(rowFont);
                g.setColor(rowText);
                x = 0;
                for (int c = 0; c < Math.min(data[r].length, headers.length); c++) {
                    String val = data[r][c] != null ? data[r][c] : "";
                    // Truncate if too long
                    FontMetrics fm = g.getFontMetrics();
                    while (fm.stringWidth(val) > colWidths[c] - padding * 2 && val.length() > 3) {
                        val = val.substring(0, val.length() - 4) + "...";
                    }
                    g.drawString(val, x + padding, y + rowHeight - 9);
                    // Vertical separator
                    if (c > 0) {
                        g.setColor(BORDER_COLOR);
                        g.drawLine(x, y, x, y + rowHeight);
                        g.setColor(rowText);
                    }
                    x += colWidths[c];
                }
                y += rowHeight;
            }
        }

        // Outer border
        g.setColor(DARK_BLUE);
        g.drawRect(0, titleHeight - 6, totalWidth + 1, totalHeight - titleHeight + 5);

        g.dispose();

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate table image: {}", e.getMessage());
            return new byte[0];
        }
    }

    // ==================== ROW DATA BUILDERS FOR IMAGES ====================

    private String[][] buildTodaysTaskRows(List<TodoTask> tasks) {
        if (tasks.isEmpty()) {
            return new String[][]{{"", "", "No tasks due today", "", "", "", "", ""}};
        }
        String[][] rows = new String[tasks.size()][];
        for (int i = 0; i < tasks.size(); i++) {
            TodoTask t = tasks.get(i);
            rows[i] = new String[]{
                    String.valueOf(i + 1),
                    t.getTaskCode(),
                    t.getTitle(),
                    t.getAssignedToName() != null ? t.getAssignedToName() : t.getAssignedTo(),
                    t.getCategory(),
                    t.getPriority(),
                    t.getStatus(),
                    t.getProject() != null ? t.getProject() : ""
            };
        }
        return rows;
    }

    private String[][] buildAllTaskRows(List<TodoTask> tasks, LocalDate today) {
        if (tasks.isEmpty()) {
            return new String[][]{{"", "", "All tasks completed!", "", "", "", "", "", ""}};
        }
        String[][] rows = new String[tasks.size()][];
        for (int i = 0; i < tasks.size(); i++) {
            TodoTask t = tasks.get(i);
            long daysLeft = ChronoUnit.DAYS.between(today, t.getTargetDate());
            String daysText = daysLeft < 0 ? "OVERDUE " + Math.abs(daysLeft) + "d"
                    : daysLeft == 0 ? "DUE TODAY"
                    : daysLeft + "d left";
            rows[i] = new String[]{
                    String.valueOf(i + 1),
                    t.getTaskCode(),
                    t.getTitle(),
                    t.getAssignedToName() != null ? t.getAssignedToName() : t.getAssignedTo(),
                    t.getCategory(),
                    t.getPriority(),
                    t.getStatus(),
                    t.getTargetDate().format(DATE_FMT),
                    daysText
            };
        }
        return rows;
    }

    /** Returns int[] where -1=overdue, 0=due-today, 1=normal */
    private int[] buildOverdueFlags(List<TodoTask> tasks, LocalDate today) {
        int[] flags = new int[tasks.size()];
        for (int i = 0; i < tasks.size(); i++) {
            long daysLeft = ChronoUnit.DAYS.between(today, tasks.get(i).getTargetDate());
            flags[i] = daysLeft < 0 ? -1 : (daysLeft == 0 ? 0 : 1);
        }
        return flags;
    }

    private String[][] buildCompletedTaskRows(List<TodoTaskDto> tasks) {
        if (tasks.isEmpty()) {
            return new String[][]{{"", "", "No tasks completed this week", "", "", "", "", ""}};
        }
        String[][] rows = new String[tasks.size()][];
        for (int i = 0; i < tasks.size(); i++) {
            TodoTaskDto t = tasks.get(i);
            long delay = t.getActualCompletionDate() != null ?
                    ChronoUnit.DAYS.between(t.getTargetDate(), t.getActualCompletionDate()) : 0;
            String status = delay > 0 ? "Delayed " + delay + "d" : delay < 0 ? "Early " + Math.abs(delay) + "d" : "On Time";
            rows[i] = new String[]{
                    String.valueOf(i + 1),
                    t.getTaskCode(),
                    t.getTitle(),
                    t.getAssignedToName() != null ? t.getAssignedToName() : t.getAssignedTo(),
                    t.getCategory(),
                    t.getTargetDate().format(DATE_FMT),
                    t.getActualCompletionDate() != null ? t.getActualCompletionDate().format(DATE_FMT) : "N/A",
                    status
            };
        }
        return rows;
    }

    private String[][] buildPendingTaskRows(List<TodoTaskDto> tasks) {
        if (tasks.isEmpty()) {
            return new String[][]{{"", "", "All tasks completed!", "", "", "", "", ""}};
        }
        String[][] rows = new String[tasks.size()][];
        for (int i = 0; i < tasks.size(); i++) {
            TodoTaskDto t = tasks.get(i);
            String daysText = t.getDaysRemaining() != null ?
                    (t.getDaysRemaining() < 0 ? "OVERDUE " + Math.abs(t.getDaysRemaining()) + "d"
                            : t.getDaysRemaining() == 0 ? "DUE TODAY"
                            : t.getDaysRemaining() + "d left") : "";
            rows[i] = new String[]{
                    String.valueOf(i + 1),
                    t.getTaskCode(),
                    t.getTitle(),
                    t.getAssignedToName() != null ? t.getAssignedToName() : t.getAssignedTo(),
                    t.getPriority(),
                    t.getStatus(),
                    t.getTargetDate().format(DATE_FMT),
                    daysText
            };
        }
        return rows;
    }

    private int[] buildPendingOverdueFlags(List<TodoTaskDto> tasks) {
        int[] flags = new int[tasks.size()];
        for (int i = 0; i < tasks.size(); i++) {
            Long dr = tasks.get(i).getDaysRemaining();
            flags[i] = (dr != null && dr < 0) ? -1 : (dr != null && dr == 0) ? 0 : 1;
        }
        return flags;
    }

    // ==================== HTML EMAIL BODY ====================

    private String buildDailyHtmlBody(int todaysCount, int allCount, LocalDate today) {
        return "<div style='font-family:Arial,sans-serif;max-width:900px;'>"
                + "<h2 style='color:#000080;'>ArcadiaPremium - Daily Task Report</h2>"
                + "<p style='font-size:14px;color:#333;'>Date: <b>" + today.format(DATE_FMT) + "</b></p>"
                + "<p style='font-size:14px;color:#333;'>Today's Tasks: <b>" + todaysCount + "</b> &nbsp;|&nbsp; Total Pending/Overdue: <b>" + allCount + "</b></p>"
                + "<hr style='border:1px solid #000080;'/>"
                + "<h3 style='color:#000080;'>Today's Target Tasks</h3>"
                + "<img src='cid:todaysTasksImage' style='max-width:100%;border:1px solid #ccc;' />"
                + "<br/><br/>"
                + "<h3 style='color:#000080;'>All Pending & Overdue Tasks</h3>"
                + "<img src='cid:allTasksImage' style='max-width:100%;border:1px solid #ccc;' />"
                + "<br/><br/>"
                + "<p style='font-size:13px;color:#666;'>Excel report attached for detailed view. "
                + "<a href='https://arcadiapremium.duckdns.org'>Open ArcadiaPremium</a></p>"
                + "</div>";
    }

    private String buildWeeklyHtmlBody(int completedCount, int pendingCount, LocalDate weekStart, LocalDate today) {
        return "<div style='font-family:Arial,sans-serif;max-width:900px;'>"
                + "<h2 style='color:#000080;'>ArcadiaPremium - Weekly Task Summary</h2>"
                + "<p style='font-size:14px;color:#333;'>Period: <b>" + weekStart.format(DATE_FMT) + "</b> to <b>" + today.format(DATE_FMT) + "</b></p>"
                + "<p style='font-size:14px;color:#333;'>Completed: <b>" + completedCount + "</b> &nbsp;|&nbsp; Pending: <b>" + pendingCount + "</b></p>"
                + "<hr style='border:1px solid #000080;'/>"
                + "<h3 style='color:#000080;'>Completed This Week</h3>"
                + "<img src='cid:todaysTasksImage' style='max-width:100%;border:1px solid #ccc;' />"
                + "<br/><br/>"
                + "<h3 style='color:#000080;'>Pending & Overdue Tasks</h3>"
                + "<img src='cid:allTasksImage' style='max-width:100%;border:1px solid #ccc;' />"
                + "<br/><br/>"
                + "<p style='font-size:13px;color:#666;'>Excel report attached for detailed view. "
                + "<a href='https://arcadiapremium.duckdns.org'>Open ArcadiaPremium</a></p>"
                + "</div>";
    }

    // ==================== EXCEL GENERATION ====================

    private byte[] generateDailyExcel(List<TodoTask> todaysTasks, List<TodoTask> allTasks, LocalDate today) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle overdueStyle = createOverdueStyle(workbook);
            CellStyle dueTodayStyle = createDueTodayStyle(workbook);

            // Sheet 1: Today's Target Tasks
            Sheet sheet1 = workbook.createSheet("Today's Tasks");
            createTitleRow(sheet1, titleStyle, "TODAY'S TARGET TASKS - " + today.format(DATE_FMT), 9);
            String[] headers1 = {"S.No", "Task Code", "Title", "Assigned To", "Category", "Priority", "Status", "Project", "Last Update"};
            createHeaderRow(sheet1, headerStyle, headers1, 2);

            int rowIdx = 3;
            if (todaysTasks.isEmpty()) {
                Row emptyRow = sheet1.createRow(rowIdx);
                Cell cell = emptyRow.createCell(0);
                cell.setCellValue("No tasks due today");
                cell.setCellStyle(dataStyle);
                sheet1.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 0, 8));
            } else {
                for (int i = 0; i < todaysTasks.size(); i++) {
                    TodoTask t = todaysTasks.get(i);
                    Row row = sheet1.createRow(rowIdx++);
                    createDataCell(row, 0, String.valueOf(i + 1), dataStyle);
                    createDataCell(row, 1, t.getTaskCode(), dataStyle);
                    createDataCell(row, 2, t.getTitle(), dataStyle);
                    createDataCell(row, 3, t.getAssignedToName() != null ? t.getAssignedToName() : t.getAssignedTo(), dataStyle);
                    createDataCell(row, 4, t.getCategory(), dataStyle);
                    createDataCell(row, 5, t.getPriority(), dataStyle);
                    createDataCell(row, 6, t.getStatus(), dataStyle);
                    createDataCell(row, 7, t.getProject() != null ? t.getProject() : "", dataStyle);
                    createDataCell(row, 8, t.getDailyUpdate() != null ? t.getDailyUpdate() : "", dataStyle);
                }
            }
            autoSizeColumns(sheet1, 9);

            // Sheet 2: All Pending & Overdue Tasks
            Sheet sheet2 = workbook.createSheet("All Pending Tasks");
            createTitleRow(sheet2, titleStyle, "ALL PENDING & OVERDUE TASKS - " + today.format(DATE_FMT), 10);
            String[] headers2 = {"S.No", "Task Code", "Title", "Assigned To", "Category", "Priority", "Status", "Target Date", "Days Remaining", "Project"};
            createHeaderRow(sheet2, headerStyle, headers2, 2);

            rowIdx = 3;
            if (allTasks.isEmpty()) {
                Row emptyRow = sheet2.createRow(rowIdx);
                Cell cell = emptyRow.createCell(0);
                cell.setCellValue("All tasks completed!");
                cell.setCellStyle(dataStyle);
                sheet2.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 0, 9));
            } else {
                for (int i = 0; i < allTasks.size(); i++) {
                    TodoTask t = allTasks.get(i);
                    long daysLeft = ChronoUnit.DAYS.between(today, t.getTargetDate());
                    CellStyle rowStyle = daysLeft < 0 ? overdueStyle : (daysLeft == 0 ? dueTodayStyle : dataStyle);

                    Row row = sheet2.createRow(rowIdx++);
                    createDataCell(row, 0, String.valueOf(i + 1), rowStyle);
                    createDataCell(row, 1, t.getTaskCode(), rowStyle);
                    createDataCell(row, 2, t.getTitle(), rowStyle);
                    createDataCell(row, 3, t.getAssignedToName() != null ? t.getAssignedToName() : t.getAssignedTo(), rowStyle);
                    createDataCell(row, 4, t.getCategory(), rowStyle);
                    createDataCell(row, 5, t.getPriority(), rowStyle);
                    createDataCell(row, 6, t.getStatus(), rowStyle);
                    createDataCell(row, 7, t.getTargetDate().format(DATE_FMT), rowStyle);
                    String daysText = daysLeft < 0 ? "OVERDUE by " + Math.abs(daysLeft) + " day(s)"
                            : daysLeft == 0 ? "DUE TODAY" : daysLeft + " day(s) left";
                    createDataCell(row, 8, daysText, rowStyle);
                    createDataCell(row, 9, t.getProject() != null ? t.getProject() : "", rowStyle);
                }
            }
            autoSizeColumns(sheet2, 10);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    private byte[] generateWeeklyExcel(List<TodoTaskDto> completedTasks, List<TodoTaskDto> pendingTasks,
                                        LocalDate weekStart, LocalDate today) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle overdueStyle = createOverdueStyle(workbook);
            CellStyle completedStyle = createCompletedStyle(workbook);

            Sheet sheet1 = workbook.createSheet("Completed This Week");
            createTitleRow(sheet1, titleStyle, "COMPLETED TASKS (" + weekStart.format(DATE_FMT) + " to " + today.format(DATE_FMT) + ")", 8);
            String[] headers1 = {"S.No", "Task Code", "Title", "Assigned To", "Category", "Target Date", "Completed Date", "Status"};
            createHeaderRow(sheet1, headerStyle, headers1, 2);

            int rowIdx = 3;
            if (completedTasks.isEmpty()) {
                Row emptyRow = sheet1.createRow(rowIdx);
                Cell cell = emptyRow.createCell(0);
                cell.setCellValue("No tasks completed this week");
                cell.setCellStyle(dataStyle);
                sheet1.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 0, 7));
            } else {
                for (int i = 0; i < completedTasks.size(); i++) {
                    TodoTaskDto t = completedTasks.get(i);
                    Row row = sheet1.createRow(rowIdx++);
                    long delay = t.getActualCompletionDate() != null ?
                            ChronoUnit.DAYS.between(t.getTargetDate(), t.getActualCompletionDate()) : 0;
                    String status = delay > 0 ? "Delayed by " + delay + " day(s)"
                            : delay < 0 ? "Early by " + Math.abs(delay) + " day(s)" : "On Time";

                    createDataCell(row, 0, String.valueOf(i + 1), completedStyle);
                    createDataCell(row, 1, t.getTaskCode(), completedStyle);
                    createDataCell(row, 2, t.getTitle(), completedStyle);
                    createDataCell(row, 3, t.getAssignedToName() != null ? t.getAssignedToName() : t.getAssignedTo(), completedStyle);
                    createDataCell(row, 4, t.getCategory(), completedStyle);
                    createDataCell(row, 5, t.getTargetDate().format(DATE_FMT), completedStyle);
                    createDataCell(row, 6, t.getActualCompletionDate() != null ? t.getActualCompletionDate().format(DATE_FMT) : "N/A", completedStyle);
                    createDataCell(row, 7, status, completedStyle);
                }
            }
            autoSizeColumns(sheet1, 8);

            Sheet sheet2 = workbook.createSheet("Pending & Overdue");
            createTitleRow(sheet2, titleStyle, "PENDING & OVERDUE TASKS", 9);
            String[] headers2 = {"S.No", "Task Code", "Title", "Assigned To", "Category", "Priority", "Status", "Target Date", "Days Remaining"};
            createHeaderRow(sheet2, headerStyle, headers2, 2);

            rowIdx = 3;
            if (pendingTasks.isEmpty()) {
                Row emptyRow = sheet2.createRow(rowIdx);
                Cell cell = emptyRow.createCell(0);
                cell.setCellValue("All tasks completed!");
                cell.setCellStyle(dataStyle);
                sheet2.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 0, 8));
            } else {
                for (int i = 0; i < pendingTasks.size(); i++) {
                    TodoTaskDto t = pendingTasks.get(i);
                    boolean isOverdue = t.getDaysRemaining() != null && t.getDaysRemaining() < 0;
                    CellStyle rowStyle = isOverdue ? overdueStyle : dataStyle;

                    Row row = sheet2.createRow(rowIdx++);
                    createDataCell(row, 0, String.valueOf(i + 1), rowStyle);
                    createDataCell(row, 1, t.getTaskCode(), rowStyle);
                    createDataCell(row, 2, t.getTitle(), rowStyle);
                    createDataCell(row, 3, t.getAssignedToName() != null ? t.getAssignedToName() : t.getAssignedTo(), rowStyle);
                    createDataCell(row, 4, t.getCategory(), rowStyle);
                    createDataCell(row, 5, t.getPriority(), rowStyle);
                    createDataCell(row, 6, t.getStatus(), rowStyle);
                    createDataCell(row, 7, t.getTargetDate().format(DATE_FMT), rowStyle);
                    String daysText = t.getDaysRemaining() != null ?
                            (t.getDaysRemaining() < 0 ? "OVERDUE by " + Math.abs(t.getDaysRemaining()) + " day(s)"
                                    : t.getDaysRemaining() == 0 ? "DUE TODAY"
                                    : t.getDaysRemaining() + " day(s) left") : "";
                    createDataCell(row, 8, daysText, rowStyle);
                }
            }
            autoSizeColumns(sheet2, 9);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    // ==================== EXCEL STYLE HELPERS ====================

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        org.apache.poi.ss.usermodel.Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        org.apache.poi.ss.usermodel.Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDataStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        org.apache.poi.ss.usermodel.Font font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setWrapText(true);
        return style;
    }

    private CellStyle createOverdueStyle(Workbook wb) {
        CellStyle style = createDataStyle(wb);
        style.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        org.apache.poi.ss.usermodel.Font font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setColor(IndexedColors.RED.getIndex());
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private CellStyle createDueTodayStyle(Workbook wb) {
        CellStyle style = createDataStyle(wb);
        style.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        org.apache.poi.ss.usermodel.Font font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private CellStyle createCompletedStyle(Workbook wb) {
        CellStyle style = createDataStyle(wb);
        style.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private void createTitleRow(Sheet sheet, CellStyle titleStyle, String title, int colSpan) {
        Row row = sheet.createRow(0);
        Cell cell = row.createCell(0);
        cell.setCellValue(title);
        cell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, colSpan - 1));
    }

    private void createHeaderRow(Sheet sheet, CellStyle headerStyle, String[] headers, int rowNum) {
        Row row = sheet.createRow(rowNum);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
    }

    private void createDataCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private void autoSizeColumns(Sheet sheet, int colCount) {
        for (int i = 0; i < colCount; i++) {
            sheet.autoSizeColumn(i);
            int width = sheet.getColumnWidth(i);
            if (width > 8000) sheet.setColumnWidth(i, 8000);
            if (width < 3000) sheet.setColumnWidth(i, 3000);
        }
    }

    // ==================== WHATSAPP TEXT SUMMARIES ====================

    private String buildWhatsAppDailySummary(List<TodoTask> todaysTasks, List<TodoTask> allTasks, LocalDate today) {
        StringBuilder sb = new StringBuilder();
        sb.append("ARCADIA PREMIUM\nDaily Task Report - ").append(today.format(DATE_FMT)).append("\n\n");

        sb.append("TODAY'S TASKS (").append(todaysTasks.size()).append(")\n");
        if (todaysTasks.isEmpty()) {
            sb.append("No tasks due today\n");
        } else {
            for (TodoTask t : todaysTasks) {
                sb.append("- ").append(t.getTaskCode()).append(": ").append(t.getTitle());
                sb.append(" [").append(t.getAssignedToName() != null ? t.getAssignedToName() : t.getAssignedTo()).append("]\n");
            }
        }

        sb.append("\nALL PENDING (").append(allTasks.size()).append(")\n");
        for (TodoTask t : allTasks) {
            long daysLeft = ChronoUnit.DAYS.between(today, t.getTargetDate());
            sb.append("- ").append(t.getTaskCode()).append(": ").append(t.getTitle());
            if (daysLeft < 0) sb.append(" [OVERDUE ").append(Math.abs(daysLeft)).append("d]");
            else if (daysLeft == 0) sb.append(" [TODAY]");
            else sb.append(" [").append(daysLeft).append("d left]");
            sb.append("\n");
        }

        sb.append("\nDetails: https://arcadiapremium.duckdns.org");
        return sb.toString();
    }

    private String buildWhatsAppWeeklySummary(List<TodoTaskDto> completedTasks, List<TodoTaskDto> pendingTasks,
                                               LocalDate weekStart, LocalDate today) {
        StringBuilder sb = new StringBuilder();
        sb.append("ARCADIA PREMIUM\nWeekly Summary: ").append(weekStart.format(DATE_FMT)).append(" - ").append(today.format(DATE_FMT)).append("\n\n");

        sb.append("COMPLETED (").append(completedTasks.size()).append(")\n");
        for (TodoTaskDto t : completedTasks) {
            sb.append("- ").append(t.getTaskCode()).append(": ").append(t.getTitle()).append("\n");
        }

        sb.append("\nPENDING (").append(pendingTasks.size()).append(")\n");
        for (TodoTaskDto t : pendingTasks) {
            sb.append("- ").append(t.getTaskCode()).append(": ").append(t.getTitle());
            if (t.getDaysRemaining() != null && t.getDaysRemaining() < 0) {
                sb.append(" [OVERDUE ").append(Math.abs(t.getDaysRemaining())).append("d]");
            }
            sb.append("\n");
        }

        sb.append("\nDetails: https://arcadiapremium.duckdns.org");
        return sb.toString();
    }

    // ==================== SEND HELPERS ====================

    /**
     * Sends HTML email with two inline images (CID) and an Excel attachment.
     */
    private void sendHtmlEmailWithImages(String toEmail, String name, String subject, String htmlBody,
                                          byte[] excelAttachment, String excelFileName,
                                          byte[] image1, byte[] image2) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML

            // Inline images (referenced in HTML as cid:todaysTasksImage and cid:allTasksImage)
            if (image1 != null && image1.length > 0) {
                helper.addInline("todaysTasksImage", new ByteArrayResource(image1), "image/png");
            }
            if (image2 != null && image2.length > 0) {
                helper.addInline("allTasksImage", new ByteArrayResource(image2), "image/png");
            }

            // Excel attachment
            helper.addAttachment(excelFileName, new ByteArrayResource(excelAttachment),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

            mailSender.send(mimeMessage);
            log.info("Task email with images + Excel sent to {} ({})", name, toEmail);
        } catch (Exception e) {
            log.error("Failed to send task email to {}: {}", toEmail, e.getMessage());
        }
    }

    private void sendWhatsApp(String phone, String message) {
        try {
            if (whatsAppService.isConfigured()) {
                whatsAppService.sendTextMessage(phone, message);
                log.info("Task WhatsApp sent to {}", phone);
            }
        } catch (Exception e) {
            log.error("Failed to send task WhatsApp to {}: {}", phone, e.getMessage());
        }
    }
}
