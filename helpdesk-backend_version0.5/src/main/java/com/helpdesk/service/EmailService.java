package com.helpdesk.service;

public interface EmailService {
    void sendVerificationEmail(String email, String token);
    void sendPasswordResetEmail(String email, String token);
    void sendPasswordChangeConfirmation(String email);
    void sendTicketCreatedEmail(String email, String ticketId);
    void sendTicketResolvedEmail(String email, String ticketId);
    void sendAgentResponseEmail(String email, String ticketId, String message);
    void sendLoginNotificationEmail(String email, String userType);
    void sendAgentPasswordResetToAdmin(String agentEmail, String adminEmail);
}
