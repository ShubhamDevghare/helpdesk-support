package com.helpdesk.dto.response;

import com.helpdesk.enums.Priority;
import com.helpdesk.enums.TicketCategory;
import com.helpdesk.enums.TicketStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TicketResponse {
    private Long id;
    private String ticketId;
    private String title;
    private String description;
    private TicketCategory category;
    private Priority priority;
    private TicketStatus status;
    private UserResponse customer;
    private UserResponse assignedAgent;
    private LocalDateTime dueDate;
    private LocalDateTime resolvedAt;
    private Integer customerRating;
    private String customerFeedback;
    private Boolean escalated;
    private String escalationReason;
    private LocalDateTime escalatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CommentResponse> comments;
    private List<AttachmentResponse> attachments;
}
