package com.helpdesk.dto.request;

import com.helpdesk.enums.Priority;
import com.helpdesk.enums.TicketCategory;
import com.helpdesk.enums.TicketStatus;
import lombok.Data;

@Data
public class TicketUpdateRequest {
    private String title;
    private String description;
    private TicketCategory category;
    private Priority priority;
    private TicketStatus status;
    private Long assignedAgentId;
    private Boolean escalated;
}
