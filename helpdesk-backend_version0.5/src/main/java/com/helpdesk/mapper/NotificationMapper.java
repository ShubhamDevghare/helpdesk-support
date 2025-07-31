package com.helpdesk.mapper;

import com.helpdesk.dto.response.NotificationResponse;
import com.helpdesk.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
        if (notification == null) return null;

        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setType(notification.getType());
        response.setIsRead(notification.getIsRead());
        response.setCreatedAt(notification.getCreatedAt());
        response.setReadAt(notification.getReadAt());
        
        if (notification.getTicket() != null) {
            response.setTicketId(notification.getTicket().getTicketId());
        }
        
        return response;
    }
}
