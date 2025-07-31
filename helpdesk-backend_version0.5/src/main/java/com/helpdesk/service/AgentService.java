package com.helpdesk.service;

import com.helpdesk.dto.response.TicketResponse;
import com.helpdesk.enums.AgentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AgentService {
    void updateAgentStatus(String employeeId, AgentStatus status);
    AgentStatus getAgentStatus(String employeeId);
    Page<TicketResponse> getAssignedTickets(Long agentId, Pageable pageable);
    Page<TicketResponse> searchAssignedTickets(Long agentId, String searchTerm, Pageable pageable);
    Page<TicketResponse> getEscalatedTickets(Long agentId, Pageable pageable);
    Object getAgentPerformance(Long agentId);
    Object getAgentDashboardStats(String employeeId);
    String generateEmployeeId();
}
