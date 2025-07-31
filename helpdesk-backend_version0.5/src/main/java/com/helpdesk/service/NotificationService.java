package com.helpdesk.service;

import com.helpdesk.dto.response.NotificationResponse;
import com.helpdesk.entity.Agent;
import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {
    void sendTicketAssignmentNotification(Agent agent, Ticket ticket);
    void sendTicketStatusUpdateNotification(Ticket ticket);
    void sendNewTicketNotification(Ticket ticket);
    void sendEscalationNotification(Ticket ticket);
    void sendFollowUpReminder(Ticket ticket);
    void sendOverdueTicketNotification(Ticket ticket);
    Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable);
    void markNotificationAsRead(Long notificationId);
    void markAllNotificationsAsRead(Long userId);
    long getUnreadNotificationCount(Long userId);
}
