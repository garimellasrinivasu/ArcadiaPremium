package com.arcadia.premium.service;

import com.arcadia.premium.model.SiteAttendance;
import com.arcadia.premium.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@arcadiapremium.com}")
    private String fromAddress;

    @Value("${app.whatsapp.enabled:false}")
    private boolean whatsappEnabled;

    @Value("${app.whatsapp.api-url:}")
    private String whatsappApiUrl;

    @Value("${app.whatsapp.api-token:}")
    private String whatsappApiToken;

    public NotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

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
        sendEmail(approver, submitterName, message);

        // Send WhatsApp if configured
        if (whatsappEnabled && approver.getPhone() != null && !approver.getPhone().isBlank()) {
            sendWhatsApp(approver.getPhone(), message);
        }
    }

    private void sendEmail(User approver, String submitterName, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(approver.getEmail());
            msg.setSubject("ArcadiaPremium – Site Attendance Approval Needed from " + submitterName);
            msg.setText("Dear " + approver.getFirstName() + ",\n\n" + body +
                    "\n\nRegards,\nArcadiaPremium System");
            mailSender.send(msg);
            log.info("Approval email sent to {}", approver.getEmail());
        } catch (Exception e) {
            log.error("Failed to send approval email to {}: {}", approver.getEmail(), e.getMessage());
        }
    }

    private void sendWhatsApp(String phone, String message) {
        try {
            // Normalize phone number (remove spaces, add country code if needed)
            String normalizedPhone = phone.replaceAll("[^0-9+]", "");
            if (!normalizedPhone.startsWith("+")) {
                normalizedPhone = "+91" + normalizedPhone; // Default to India
            }

            if (whatsappApiUrl.isBlank()) {
                // Fallback: generate a WhatsApp Web link (logged for manual use)
                String waLink = "https://wa.me/" + normalizedPhone.replace("+", "") +
                        "?text=" + URLEncoder.encode(message, StandardCharsets.UTF_8);
                log.info("WhatsApp notification link: {}", waLink);
                return;
            }

            // If a WhatsApp Business API endpoint is configured, call it
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
}
