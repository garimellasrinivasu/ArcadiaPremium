package com.arcadia.premium.service;

import com.arcadia.premium.dto.NotificationConfigDto;
import com.arcadia.premium.model.NotificationConfig;
import com.arcadia.premium.model.SiteAttendance;
import com.arcadia.premium.model.User;
import com.arcadia.premium.repository.NotificationConfigRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationConfigRepository configRepo;
    private final WhatsAppService whatsAppService;
    private final WorkExecutionReportService reportService;
    private final SummaryImageGenerator summaryImageGenerator;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@arcadiapremium.com}")
    private String fromAddress;

    @Value("${app.whatsapp.enabled:false}")
    private boolean whatsappEnabled;

    @Value("${app.whatsapp.api-url:}")
    private String whatsappApiUrl;

    @Value("${app.whatsapp.api-token:}")
    private String whatsappApiToken;

    public NotificationService(NotificationConfigRepository configRepo,
                                WhatsAppService whatsAppService,
                                WorkExecutionReportService reportService,
                                SummaryImageGenerator summaryImageGenerator,
                                JavaMailSender mailSender) {
        this.configRepo = configRepo;
        this.whatsAppService = whatsAppService;
        this.reportService = reportService;
        this.summaryImageGenerator = summaryImageGenerator;
        this.mailSender = mailSender;
    }

    // --- Legacy attendance approval notifications (used by SiteAttendanceService) ---

    @Async
    public void notifyApprover(User approver, String submitterName, SiteAttendance attendance) {
        String message = String.format(
            "Site Attendance Approval Required\n\n" +
            "Submitted by: %s\n" +
            "Site: %s\n" +
            "Date: %s\n" +
            "Workers: %d (Male: %d, Female: %d)\n\n" +
            "Please login to ArcadiaPremium to review and approve/reject.",
            submitterName,
            attendance.getSiteName(),
            attendance.getAttendanceDate(),
            attendance.getTotalWorkers(),
            attendance.getMaleCount(),
            attendance.getFemaleCount()
        );

        // Send Email
        sendApprovalEmail(approver, submitterName, message);

        // Send WhatsApp if configured
        if (whatsappEnabled && approver.getPhone() != null && !approver.getPhone().isBlank()) {
            sendLegacyWhatsApp(approver.getPhone(), message);
        }
    }

    private void sendApprovalEmail(User approver, String submitterName, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(approver.getEmail());
            msg.setSubject("ArcadiaPremium - Site Attendance Approval Needed from " + submitterName);
            msg.setText("Dear " + approver.getFirstName() + ",\n\n" + body +
                    "\n\nRegards,\nArcadiaPremium System");
            mailSender.send(msg);
            log.info("Approval email sent to {}", approver.getEmail());
        } catch (Exception e) {
            log.error("Failed to send approval email to {}: {}", approver.getEmail(), e.getMessage());
        }
    }

    private void sendLegacyWhatsApp(String phone, String message) {
        try {
            String normalizedPhone = phone.replaceAll("[^0-9+]", "");
            if (!normalizedPhone.startsWith("+")) {
                normalizedPhone = "+91" + normalizedPhone;
            }

            if (whatsappApiUrl.isBlank()) {
                String waLink = "https://wa.me/" + normalizedPhone.replace("+", "") +
                        "?text=" + URLEncoder.encode(message, StandardCharsets.UTF_8);
                log.info("WhatsApp notification link: {}", waLink);
                return;
            }

            RestTemplate rest = new RestTemplate();
            String payload = String.format(
                "{\"phone\":\"%s\",\"message\":\"%s\"}",
                normalizedPhone,
                message.replace("\"", "\\\"").replace("\n", "\\n")
            );

            var headers = new org.springframework.http.HttpHeaders();
            headers.set("Content-Type", "application/json");
            if (!whatsappApiToken.isBlank()) {
                headers.set("Authorization", "Bearer " + whatsappApiToken);
            }

            var entity = new org.springframework.http.HttpEntity<>(payload, headers);
            rest.postForEntity(whatsappApiUrl, entity, String.class);
            log.info("WhatsApp notification sent to {}", normalizedPhone);
        } catch (Exception e) {
            log.error("Failed to send WhatsApp to {}: {}", phone, e.getMessage());
        }
    }

    // --- Config CRUD ---

    public List<NotificationConfigDto> getConfigs(String projectName) {
        return configRepo.findByProjectName(projectName).stream()
                .map(NotificationConfigDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<NotificationConfigDto> getAllConfigs() {
        return configRepo.findAll().stream()
                .map(NotificationConfigDto::fromEntity)
                .collect(Collectors.toList());
    }

    public NotificationConfigDto addConfig(NotificationConfigDto dto) {
        NotificationConfig entity = new NotificationConfig();
        entity.setProjectName(dto.getProjectName());
        entity.setConfigType(dto.getConfigType());
        entity.setRecipientName(dto.getRecipientName());
        entity.setRecipientValue(dto.getRecipientValue());
        entity.setActive(true);
        try {
            entity.setCreatedBy(SecurityContextHolder.getContext().getAuthentication().getName());
        } catch (Exception ignored) {}
        entity = configRepo.save(entity);
        return NotificationConfigDto.fromEntity(entity);
    }

    public NotificationConfigDto updateConfig(Long id, NotificationConfigDto dto) {
        NotificationConfig entity = configRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Config not found: " + id));
        entity.setRecipientName(dto.getRecipientName());
        entity.setRecipientValue(dto.getRecipientValue());
        entity.setActive(dto.isActive());
        entity = configRepo.save(entity);
        return NotificationConfigDto.fromEntity(entity);
    }

    public void deleteConfig(Long id) {
        configRepo.deleteById(id);
    }

    // --- Send Notifications ---

    /**
     * Send Work Execution Summary to all configured WhatsApp + Email recipients for a project
     */
    public Map<String, Object> sendSummary(String projectName) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
        String dateStr = LocalDate.now().format(fmt);

        // Generate villa-wise status Excel
        byte[] villaWiseExcel = null;
        String villaWiseFileName = "VillaWise_Status_" + projectName.replaceAll("\\s+", "_") + "_" + dateStr + ".xlsx";
        try {
            villaWiseExcel = reportService.generateVillaWiseExcel(projectName);
            log.info("Villa-wise Excel generated: {} bytes", villaWiseExcel != null ? villaWiseExcel.length : 0);
        } catch (Exception e) {
            log.error("Failed to generate villa-wise Excel: {}", e.getMessage());
        }

        // Generate summary dashboard image
        byte[] summaryImage = null;
        try {
            summaryImage = summaryImageGenerator.generateSummaryImage(projectName);
            log.info("Summary image generated: {} bytes", summaryImage != null ? summaryImage.length : 0);
        } catch (Exception e) {
            log.error("Failed to generate summary image: {}", e.getMessage());
        }

        // Generate latest updates image (daily delta — last 24 hours)
        byte[] latestUpdatesImage = null;
        try {
            latestUpdatesImage = summaryImageGenerator.generateLatestUpdatesImage(projectName);
            log.info("Latest updates image generated: {} bytes", latestUpdatesImage != null ? latestUpdatesImage.length : 0);
        } catch (Exception e) {
            log.error("Failed to generate latest updates image: {}", e.getMessage());
        }

        List<Map<String, Object>> results = new ArrayList<>();

        // Send to WhatsApp recipients
        List<NotificationConfig> waRecipients = configRepo
                .findByProjectNameAndConfigTypeAndActive(projectName, "WHATSAPP", true);
        for (NotificationConfig recipient : waRecipients) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("type", "WHATSAPP");
            result.put("recipient", recipient.getRecipientValue());
            result.put("name", recipient.getRecipientName());

            // Send summary image first
            if (summaryImage != null && summaryImage.length > 0) {
                Map<String, Object> imgResult = whatsAppService.sendImage(
                        recipient.getRecipientValue(), summaryImage,
                        "Work Execution Summary - " + projectName + " - " + dateStr);
                result.put("imageSent", imgResult.get("success"));
            }

            // Send latest updates image (daily delta)
            if (latestUpdatesImage != null && latestUpdatesImage.length > 0) {
                Map<String, Object> updatesResult = whatsAppService.sendImage(
                        recipient.getRecipientValue(), latestUpdatesImage,
                        "Latest Updates (Last 24hrs) - " + projectName + " - " + dateStr);
                result.put("latestUpdatesSent", updatesResult.get("success"));
            }

            // Send Villa-wise Status Excel
            if (villaWiseExcel != null && villaWiseExcel.length > 0) {
                Map<String, Object> villaDocResult = whatsAppService.sendDocument(
                        recipient.getRecipientValue(), villaWiseExcel, villaWiseFileName,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "Villa-wise Status (1-237) - " + dateStr);
                result.put("villaWiseExcelSent", villaDocResult.get("success"));
            }

            results.add(result);
        }

        // Send to Email recipients
        List<NotificationConfig> emailRecipients = configRepo
                .findByProjectNameAndConfigTypeAndActive(projectName, "EMAIL", true);
        if (!emailRecipients.isEmpty()) {
            List<String> emailAddresses = emailRecipients.stream()
                    .map(NotificationConfig::getRecipientValue)
                    .collect(Collectors.toList());

            boolean emailSent = sendEmailWithImageAndAttachments(
                    emailAddresses,
                    "Work Execution Updates - " + projectName + " - " + dateStr,
                    buildHtmlEmailBody(projectName),
                    summaryImage, latestUpdatesImage,
                    villaWiseExcel, villaWiseFileName);

            for (NotificationConfig recipient : emailRecipients) {
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("type", "EMAIL");
                result.put("recipient", recipient.getRecipientValue());
                result.put("name", recipient.getRecipientName());
                result.put("sent", emailSent);
                results.add(result);
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("projectName", projectName);
        response.put("sentAt", java.time.LocalDateTime.now().toString());
        response.put("results", results);
        response.put("whatsappConfigured", whatsAppService.isConfigured());
        return response;
    }

    private boolean sendEmailWithImageAndAttachments(List<String> toAddresses, String subject,
                                                     String htmlBody, byte[] summaryImage,
                                                     byte[] latestUpdatesImage,
                                                     byte[] villaWiseExcel, String villaWiseFileName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toAddresses.toArray(new String[0]));
            helper.setSubject(subject);

            // Build HTML with inline summary image + latest updates image
            StringBuilder fullHtml = new StringBuilder();
            fullHtml.append("<html><body style='font-family: Arial, sans-serif;'>");

            if (summaryImage != null && summaryImage.length > 0) {
                fullHtml.append("<h2 style='color: #1a56db;'>Work Execution Summary Dashboard</h2>");
                fullHtml.append("<img src='cid:summaryImage' style='max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;' />");
                fullHtml.append("<hr style='border: 1px solid #eee; margin: 20px 0;'/>");
            }

            if (latestUpdatesImage != null && latestUpdatesImage.length > 0) {
                fullHtml.append("<h2 style='color: #16a34a;'>Latest Updates (Last 24 Hours)</h2>");
                fullHtml.append("<img src='cid:latestUpdatesImage' style='max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;' />");
                fullHtml.append("<hr style='border: 1px solid #eee; margin: 20px 0;'/>");
            }

            // Append the table-based summary
            String bodyContent = htmlBody.replace("<html><body style='font-family: Arial, sans-serif;'>", "")
                    .replace("</body></html>", "");
            fullHtml.append(bodyContent);
            fullHtml.append("</body></html>");

            helper.setText(fullHtml.toString(), true);

            // Add inline images
            if (summaryImage != null && summaryImage.length > 0) {
                helper.addInline("summaryImage", new ByteArrayResource(summaryImage), "image/png");
            }
            if (latestUpdatesImage != null && latestUpdatesImage.length > 0) {
                helper.addInline("latestUpdatesImage", new ByteArrayResource(latestUpdatesImage), "image/png");
            }

            // Attach images as downloadable files
            if (summaryImage != null && summaryImage.length > 0) {
                helper.addAttachment("WorkExecution_Summary.png", new ByteArrayResource(summaryImage), "image/png");
            }
            if (latestUpdatesImage != null && latestUpdatesImage.length > 0) {
                helper.addAttachment("Latest_Updates.png", new ByteArrayResource(latestUpdatesImage), "image/png");
            }

            if (villaWiseExcel != null && villaWiseExcel.length > 0) {
                helper.addAttachment(villaWiseFileName, new ByteArrayResource(villaWiseExcel),
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            }

            mailSender.send(message);
            log.info("Email with summary + latest updates sent to {} recipients: {}", toAddresses.size(), subject);
            return true;
        } catch (Exception e) {
            log.error("Failed to send email with image: {}", e.getMessage(), e);
            return false;
        }
    }

    private boolean sendEmailWithAttachments(List<String> toAddresses, String subject,
                                              String htmlBody, byte[] excelData, String excelFileName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toAddresses.toArray(new String[0]));
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            if (excelData != null && excelData.length > 0) {
                helper.addAttachment(excelFileName, new ByteArrayResource(excelData),
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            }

            mailSender.send(message);
            log.info("Email sent to {} recipients: {}", toAddresses.size(), subject);
            return true;
        } catch (Exception e) {
            log.error("Failed to send email: {}", e.getMessage(), e);
            return false;
        }
    }

    private String buildHtmlEmailBody(String projectName) {
        Map<String, Object> summary = reportService.generateSummary(projectName);

        StringBuilder html = new StringBuilder();
        html.append("<html><body style='font-family: Arial, sans-serif;'>");
        html.append("<h2 style='color: #1a56db;'>Work Execution Updates Summary</h2>");
        html.append("<p><strong>Project:</strong> ").append(projectName).append("</p>");
        html.append("<p><strong>Date:</strong> ").append(summary.get("reportDate")).append("</p>");

        html.append("<table style='border-collapse: collapse; width: 100%; margin-top: 16px;'>");
        html.append("<tr style='background-color: #1a56db; color: white;'>");
        html.append("<th style='padding: 10px; border: 1px solid #ddd;'>Phase</th>");
        html.append("<th style='padding: 10px; border: 1px solid #ddd;'>Total</th>");
        html.append("<th style='padding: 10px; border: 1px solid #ddd;'>Completed</th>");
        html.append("<th style='padding: 10px; border: 1px solid #ddd;'>In Progress</th>");
        html.append("<th style='padding: 10px; border: 1px solid #ddd;'>Not Started</th>");
        html.append("<th style='padding: 10px; border: 1px solid #ddd;'>Delayed</th>");
        html.append("</tr>");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> phases = (List<Map<String, Object>>) summary.get("phases");
        for (Map<String, Object> phase : phases) {
            html.append("<tr>");
            html.append("<td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>").append(phase.get("phaseLabel")).append("</td>");
            html.append("<td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>").append(phase.get("total")).append("</td>");
            html.append("<td style='padding: 8px; border: 1px solid #ddd; text-align: center; color: green;'>").append(phase.get("completed")).append("</td>");
            html.append("<td style='padding: 8px; border: 1px solid #ddd; text-align: center; color: orange;'>").append(phase.get("inProgress")).append("</td>");
            html.append("<td style='padding: 8px; border: 1px solid #ddd; text-align: center; color: gray;'>").append(phase.get("notStarted")).append("</td>");
            html.append("<td style='padding: 8px; border: 1px solid #ddd; text-align: center; color: red;'>").append(phase.get("delayed")).append("</td>");
            html.append("</tr>");
        }

        html.append("<tr style='background-color: #f0f0f0; font-weight: bold;'>");
        html.append("<td style='padding: 8px; border: 1px solid #ddd;'>TOTAL</td>");
        html.append("<td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>").append(((Number)summary.get("totalCompleted")).intValue() + ((Number)summary.get("totalInProgress")).intValue() + ((Number)summary.get("totalNotStarted")).intValue()).append("</td>");
        html.append("<td style='padding: 8px; border: 1px solid #ddd; text-align: center; color: green;'>").append(summary.get("totalCompleted")).append("</td>");
        html.append("<td style='padding: 8px; border: 1px solid #ddd; text-align: center; color: orange;'>").append(summary.get("totalInProgress")).append("</td>");
        html.append("<td style='padding: 8px; border: 1px solid #ddd; text-align: center; color: gray;'>").append(summary.get("totalNotStarted")).append("</td>");
        html.append("<td style='padding: 8px; border: 1px solid #ddd;'></td>");
        html.append("</tr>");
        html.append("</table>");

        html.append("<p style='margin-top: 16px; color: #666; font-size: 12px;'>This is an automated report from Arcadia Premium. Please find the detailed Excel report attached.</p>");
        html.append("</body></html>");
        return html.toString();
    }

    /**
     * Check WhatsApp configuration status
     */
    public Map<String, Object> getStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("whatsappConfigured", whatsAppService.isConfigured());
        status.put("emailConfigured", true);
        status.put("emailFrom", fromAddress);
        status.put("totalConfigs", configRepo.count());
        return status;
    }

    /**
     * Send a test email to verify SMTP configuration
     */
    public Map<String, Object> sendTestEmail(String toAddress) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("from", fromAddress);
        result.put("to", toAddress);
        result.put("timestamp", java.time.LocalDateTime.now().toString());

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toAddress);
            helper.setSubject("Arcadia Premium - Test Email");
            helper.setText(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<h2 style='color: #1a56db;'>Arcadia Premium - Email Configuration Test</h2>" +
                "<p>This is a test email sent from the Arcadia Premium portal.</p>" +
                "<p><strong>From:</strong> " + fromAddress + "</p>" +
                "<p><strong>To:</strong> " + toAddress + "</p>" +
                "<p><strong>Sent at:</strong> " + java.time.LocalDateTime.now().format(
                    DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a")) + "</p>" +
                "<hr style='border: 1px solid #eee;'/>" +
                "<p style='color: #666; font-size: 12px;'>If you received this email, " +
                "the SMTP configuration is working correctly.</p>" +
                "</body></html>", true);

            mailSender.send(message);
            log.info("Test email sent successfully from {} to {}", fromAddress, toAddress);
            result.put("success", true);
            result.put("message", "Test email sent successfully! Please check your inbox.");
        } catch (Exception e) {
            log.error("Test email failed from {} to {}: {}", fromAddress, toAddress, e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }
}
