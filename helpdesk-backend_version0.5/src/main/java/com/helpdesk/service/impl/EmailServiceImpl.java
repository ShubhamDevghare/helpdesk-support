package com.helpdesk.service.impl;

import com.helpdesk.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    @Async("emailExecutor")
    public void sendVerificationEmail(String email, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setFrom(fromEmail);
        message.setSubject("Verify Your Email - Help Desk");
        message.setText("Welcome to Help Desk!\n\n" +
                "Please click the link below to verify your email address:\n" +
                frontendUrl + "/verify-email?token=" + token + "\n\n" +
                "If you didn't create an account, please ignore this email.\n\n" +
                "Best regards,\nHelp Desk Team");

        mailSender.send(message);
        log.info("Verification email sent to: {}", email);
    }

    @Override
    @Async("emailExecutor")
    public void sendPasswordResetEmail(String email, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setFrom(fromEmail);
        message.setSubject("Password Reset - Help Desk");
        message.setText("Hello,\n\n" +
                "You requested a password reset for your Help Desk account.\n\n" +
                "Please click the link below to reset your password:\n" +
                frontendUrl + "/reset-password?token=" + token + "\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you didn't request this reset, please ignore this email.\n\n" +
                "Best regards,\nHelp Desk Team");

        mailSender.send(message);
        log.info("Password reset email sent to: {}", email);
    }

    @Override
    @Async("emailExecutor")
    public void sendPasswordChangeConfirmation(String email) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setFrom(fromEmail);
        message.setSubject("Password Changed Successfully - Help Desk");
        message.setText("Hello,\n\n" +
                "Your password has been successfully changed.\n\n" +
                "If you didn't make this change, please contact our support team immediately.\n\n" +
                "Best regards,\nHelp Desk Team");

        mailSender.send(message);
        log.info("Password change confirmation sent to: {}", email);
    }

    @Override
    @Async("emailExecutor")
    public void sendTicketCreatedEmail(String email, String ticketId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setFrom(fromEmail);
        message.setSubject("Ticket Created - " + ticketId);
        message.setText("Hello,\n\n" +
                "Your support ticket has been created successfully.\n\n" +
                "Ticket ID: " + ticketId + "\n\n" +
                "You can track your ticket status by logging into your account.\n\n" +
                "We'll keep you updated on the progress.\n\n" +
                "Best regards,\nHelp Desk Team");

        mailSender.send(message);
        log.info("Ticket created email sent to: {} for ticket: {}", email, ticketId);
    }

    @Override
    @Async("emailExecutor")
    public void sendTicketResolvedEmail(String email, String ticketId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setFrom(fromEmail);
        message.setSubject("Ticket Resolved - " + ticketId);
        message.setText("Hello,\n\n" +
                "Great news! Your support ticket has been resolved.\n\n" +
                "Ticket ID: " + ticketId + "\n\n" +
                "Please log into your account to view the resolution details.\n\n" +
                "We'd appreciate your feedback on the resolution quality.\n\n" +
                "Best regards,\nHelp Desk Team");

        mailSender.send(message);
        log.info("Ticket resolved email sent to: {} for ticket: {}", email, ticketId);
    }

    @Override
    @Async("emailExecutor")
    public void sendAgentResponseEmail(String email, String ticketId, String message) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo(email);
        mailMessage.setFrom(fromEmail);
        mailMessage.setSubject("New Response on Ticket - " + ticketId);
        mailMessage.setText("Hello,\n\n" +
                "You have received a new response on your ticket.\n\n" +
                "Ticket ID: " + ticketId + "\n" +
                "Response: " + message + "\n\n" +
                "Please log into your account to view the full conversation.\n\n" +
                "Best regards,\nHelp Desk Team");

        mailSender.send(mailMessage);
        log.info("Agent response email sent to: {} for ticket: {}", email, ticketId);
    }

    @Override
    @Async("emailExecutor")
    public void sendLoginNotificationEmail(String email, String userType) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setFrom(fromEmail);
        message.setSubject("Login Notification - Help Desk");
        message.setText("Hello,\n\n" +
                "You have successfully logged into your Help Desk " + userType + " account.\n\n" +
                "Login Time: " + java.time.LocalDateTime.now() + "\n\n" +
                "If this wasn't you, please contact our support team immediately.\n\n" +
                "Best regards,\nHelp Desk Team");

        mailSender.send(message);
        log.info("Login notification sent to: {} for user type: {}", email, userType);
    }

    @Override
    @Async("emailExecutor")
    public void sendAgentPasswordResetToAdmin(String agentEmail, String adminEmail) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail);
        message.setFrom(fromEmail);
        message.setSubject("Agent Password Reset Request - Help Desk");
        message.setText("Hello Admin,\n\n" +
                "An agent has requested a password reset.\n\n" +
                "Agent Email: " + agentEmail + "\n\n" +
                "Please review and approve this request if legitimate.\n\n" +
                "Best regards,\nHelp Desk System");

        mailSender.send(message);
        log.info("Agent password reset notification sent to admin: {} for agent: {}", adminEmail, agentEmail);
    }
}
