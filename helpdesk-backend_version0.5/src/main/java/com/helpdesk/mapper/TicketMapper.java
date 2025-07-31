package com.helpdesk.mapper;

import com.helpdesk.dto.request.TicketCreateRequest;
import com.helpdesk.dto.response.TicketResponse;
import com.helpdesk.entity.Ticket;
import com.helpdesk.enums.Priority;
import com.helpdesk.enums.TicketCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TicketMapper {

    private final UserMapper userMapper;
    private final CommentMapper commentMapper;
    private final AttachmentMapper attachmentMapper;

    public TicketResponse toResponse(Ticket ticket) {
        if (ticket == null) return null;

        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setTicketId(ticket.getTicketId());
        response.setTitle(ticket.getTitle());
        response.setDescription(ticket.getDescription());
        response.setCategory(ticket.getCategory());
        response.setPriority(ticket.getPriority());
        response.setStatus(ticket.getStatus());
        response.setCustomer(userMapper.toResponse(ticket.getCustomer()));
        response.setAssignedAgent(userMapper.toResponse(ticket.getAssignedAgent()));
        response.setDueDate(ticket.getDueDate());
        response.setResolvedAt(ticket.getResolvedAt());
        response.setCustomerRating(ticket.getCustomerRating());
        response.setCustomerFeedback(ticket.getCustomerFeedback());
        response.setEscalated(ticket.getEscalated());
        response.setEscalationReason(ticket.getEscalationReason());
        response.setEscalatedAt(ticket.getEscalatedAt());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());

        if (ticket.getComments() != null) {
            response.setComments(ticket.getComments().stream()
                    .map(commentMapper::toResponse)
                    .collect(Collectors.toList()));
        }

        if (ticket.getAttachments() != null) {
            response.setAttachments(ticket.getAttachments().stream()
                    .map(attachmentMapper::toResponse)
                    .collect(Collectors.toList()));
        }

        return response;
    }

    public Ticket toEntity(TicketCreateRequest request) {
        if (request == null) return null;

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(determinePriority(request.getCategory()));
        return ticket;
    }

    private Priority determinePriority(TicketCategory category) {
        switch (category) {
            case TECHNICAL_SUPPORT:
            case NETWORK_CONNECTIVITY:
            case BILLING_PAYMENTS:
                return Priority.HIGH;
            case ACCOUNT_MANAGEMENT:
            case TRAINING_DOCUMENTATION:
                return Priority.MEDIUM;
            case FEATURE_REQUESTS:
            case GENERAL_INQUIRY:
            case OTHERS:
            default:
                return Priority.LOW;
        }
    }
}
