package com.helpdesk.dto.request;

import lombok.Data;

@Data
public class TicketEscalationRequest {
    private String escalationReason;
    private Long escalateToAdminId;
    private String  escalateToAgentId;
}
