package com.helpdesk.service.impl;

import com.helpdesk.dto.response.NotificationResponse;
import com.helpdesk.entity.Agent;
import com.helpdesk.entity.Notification;
import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.User;
import com.helpdesk.enums.NotificationType;
import com.helpdesk.exception.ResourceNotFoundException;
import com.helpdesk.mapper.NotificationMapper;
import com.helpdesk.repository.NotificationRepository;
import com.helpdesk.repository.UserRepository;
import com.helpdesk.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public void sendTicketAssignmentNotification(Agent agent, Ticket ticket) {
        Notification notification = new Notification();
        notification.setTitle("New Ticket Assigned");
        notification.setMessage(String.format("Your ticket %s has been assigned to Agent %s.", 
                ticket.getTicketId(), agent.getFirstName() + " " + agent.getLastName()));
        notification.setType(NotificationType.TICKET_ASSIGNED);
        notification.setRecipient(ticket.getCustomer());
        notification.setTicket(ticket);

        notificationRepository.save(notification);

        // Also notify the agent
        Notification agentNotification = new Notification();
        agentNotification.setTitle("New Ticket Assignment");
        agentNotification.setMessage(String.format("New %s ticket received – %s: '%s' (Category: %s).", 
                ticket.getPriority().toString().toLowerCase(), 
                ticket.getTicketId(), 
                ticket.getTitle(), 
                ticket.getCategory().toString()));
        agentNotification.setType(NotificationType.NEW_TICKET);
        agentNotification.setRecipient(agent);
        agentNotification.setTicket(ticket);

        notificationRepository.save(agentNotification);
        log.info("Ticket assignment notifications sent for ticket: {}", ticket.getTicketId());
    }

    @Override
    @Transactional
    public void sendTicketStatusUpdateNotification(Ticket ticket) {
        Notification notification = new Notification();
        notification.setTitle("Ticket Status Updated");
        notification.setMessage(String.format("Your ticket %s status has been updated to %s.", 
                ticket.getTicketId(), ticket.getStatus().toString()));
        notification.setType(NotificationType.TICKET_STATUS_UPDATE);
        notification.setRecipient(ticket.getCustomer());
        notification.setTicket(ticket);

        notificationRepository.save(notification);
        log.info("Ticket status update notification sent for ticket: {}", ticket.getTicketId());
    }

    @Override
    @Transactional
    public void sendNewTicketNotification(Ticket ticket) {
        if (ticket.getAssignedAgent() != null) {
            Notification notification = new Notification();
            notification.setTitle("New Ticket Alert");
            notification.setMessage(String.format("New %s ticket received – %s: '%s' (Category: %s).", 
                    ticket.getPriority().toString().toLowerCase(), 
                    ticket.getTicketId(), 
                    ticket.getTitle(), 
                    ticket.getCategory().toString()));
            notification.setType(NotificationType.NEW_TICKET);
            notification.setRecipient(ticket.getAssignedAgent());
            notification.setTicket(ticket);

            notificationRepository.save(notification);
            log.info("New ticket notification sent for ticket: {}", ticket.getTicketId());
        }
    }

    @Override
    @Transactional
    public void sendEscalationNotification(Ticket ticket) {
        // Find admin users to notify
        userRepository.findByRole(com.helpdesk.enums.Role.ADMIN).forEach(admin -> {
            Notification notification = new Notification();
            notification.setTitle("Ticket Escalated");
            notification.setMessage(String.format("Ticket %s has been escalated to %s", 
                    ticket.getTicketId(), admin.getFirstName() + " " + admin.getLastName()));
            notification.setType(NotificationType.ESCALATION_NOTICE);
            notification.setRecipient(admin);
            notification.setTicket(ticket);

            notificationRepository.save(notification);
        });
        log.info("Escalation notifications sent for ticket: {}", ticket.getTicketId());
    }

    @Override
    @Transactional
    public void sendFollowUpReminder(Ticket ticket) {
        if (ticket.getAssignedAgent() != null) {
            Notification agentNotification = new Notification();
            agentNotification.setTitle("Follow-up Reminder");
            agentNotification.setMessage(String.format("Reminder: Follow up with the customer on ticket %s – overdue by 24 hours.", 
                    ticket.getTicketId()));
            agentNotification.setType(NotificationType.FOLLOW_UP_REMINDER);
            agentNotification.setRecipient(ticket.getAssignedAgent());
            agentNotification.setTicket(ticket);

            notificationRepository.save(agentNotification);
        }

        // Also notify admin
        userRepository.findByRole(com.helpdesk.enums.Role.ADMIN).forEach(admin -> {
            Notification adminNotification = new Notification();
            adminNotification.setTitle("Action Required");
            adminNotification.setMessage(String.format("🚨 Action Required: Ticket %s: unopened by %s for 24 hours.", 
                    ticket.getTicketId(), 
                    ticket.getAssignedAgent() != null ? ticket.getAssignedAgent().getFirstName() : "Agent"));
            adminNotification.setType(NotificationType.FOLLOW_UP_REMINDER);
            adminNotification.setRecipient(admin);
            adminNotification.setTicket(ticket);

            notificationRepository.save(adminNotification);
        });
        log.info("Follow-up reminder notifications sent for ticket: {}", ticket.getTicketId());
    }

    @Override
    @Transactional
    public void sendOverdueTicketNotification(Ticket ticket) {
        if (ticket.getAssignedAgent() != null) {
            Notification notification = new Notification();
            notification.setTitle("Overdue Ticket");
            notification.setMessage(String.format("Ticket %s is overdue and requires immediate attention.", 
                    ticket.getTicketId()));
            notification.setType(NotificationType.OVERDUE_TICKET);
            notification.setRecipient(ticket.getAssignedAgent());
            notification.setTicket(ticket);

            notificationRepository.save(notification);
            log.info("Overdue ticket notification sent for ticket: {}", ticket.getTicketId());
        }
    }

    @Override
    public Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return notificationRepository.findByRecipient(user, pageable)
                .map(notificationMapper::toResponse);
    }

    @Override
    @Transactional
    public void markNotificationAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
        log.info("Notification marked as read: {}", notificationId);
    }

    @Override
    @Transactional
    public void markAllNotificationsAsRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        notificationRepository.findByRecipientAndIsRead(user, false).forEach(notification -> {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        });
        log.info("All notifications marked as read for user: {}", userId);
    }

    @Override
    public long getUnreadNotificationCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return notificationRepository.countUnreadByRecipient(user);
    }
}
