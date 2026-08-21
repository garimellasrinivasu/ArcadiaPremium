package com.arcadia.premium.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@arcadiapremium.com}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendForgotPasswordEmail(String toEmail, String userName, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("ArcadiaPremium – Temporary Password");
        message.setText(
            "Dear " + userName + ",\n\n" +
            "We received a request to reset your password.\n\n" +
            "Your temporary password is: " + tempPassword + "\n\n" +
            "Please login with this temporary password. You will be required to set a new password immediately after login.\n\n" +
            "If you did not request this, please contact your administrator.\n\n" +
            "Regards,\n" +
            "ArcadiaPremium"
        );
        try {
            mailSender.send(message);
            log.info("Forgot-password email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send forgot-password email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String toEmail, String userName, String newPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("ArcadiaPremium – Your Password Has Been Reset");
        message.setText(
            "Dear " + userName + ",\n\n" +
            "Your password has been reset by an administrator.\n\n" +
            "Your new password is: " + newPassword + "\n\n" +
            "Please login and change your password immediately using the Change Password option.\n\n" +
            "Regards,\n" +
            "ArcadiaPremium Admin"
        );
        try {
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Password was reset but email could not be sent to " + toEmail + ". Please share the new password manually. Error: " + e.getMessage());
        }
    }

    public void sendPaySlipEmail(String toEmail, String employeeName, String payMonth, String salaryDetails) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("PRANEETH ARCADIA PROPERTIES – Pay Slip for " + payMonth);
        message.setText(
            "Dear " + employeeName + ",\n\n" +
            "Your pay slip for " + payMonth + " is attached.\n\n" +
            "--- PAY SLIP DETAILS ---\n\n" +
            salaryDetails + "\n\n" +
            "Company: PRANEETH ARCADIA PROPERTIES\n\n" +
            "This is a system generated email. For any queries, please contact HR.\n\n" +
            "Regards,\n" +
            "PRANEETH ARCADIA PROPERTIES"
        );
        try {
            mailSender.send(message);
            log.info("Pay slip email sent to {} for month {}", toEmail, payMonth);
        } catch (Exception e) {
            log.error("Failed to send pay slip email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send pay slip email: " + e.getMessage());
        }
    }
}
