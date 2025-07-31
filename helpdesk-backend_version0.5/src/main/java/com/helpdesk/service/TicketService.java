package com.helpdesk.service;

import com.helpdesk.dto.request.TicketCreateRequest;
import com.helpdesk.dto.request.TicketUpdateRequest;
import com.helpdesk.dto.request.TicketRatingRequest;
import com.helpdesk.dto.request.TicketEscalationRequest;
import com.helpdesk.dto.response.TicketResponse;
import com.helpdesk.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TicketService {
    TicketResponse createTicket(TicketCreateRequest request, Long customerId);
    TicketResponse getTicketById(Long id);
    TicketResponse getTicketByTicketId(String ticketId);
    TicketResponse updateTicket(Long id, TicketUpdateRequest request);
    void deleteTicket(Long id);
    
    Page<TicketResponse> getTicketsByCustomer(Long customerId, Pageable pageable);
    Page<TicketResponse> getTicketsByAgent(Long agentId, Pageable pageable);
    Page<TicketResponse> getTicketsByStatus(TicketStatus status, Pageable pageable);
    Page<TicketResponse> getAllTickets(Pageable pageable);
    
    TicketResponse assignTicket(Long ticketId, Long agentId);
    TicketResponse escalateTicket(Long ticketId);
    TicketResponse escalateTicketToAdmin(String ticketId, TicketEscalationRequest request, String agentId);
    TicketResponse escalateTicketToAgent(String ticketId, TicketEscalationRequest request, Long adminId);
    TicketResponse reopenTicket(Long ticketId);
    TicketResponse rateTicket(Long ticketId, TicketRatingRequest request);
    
    List<TicketResponse> getOverdueTickets();
    TicketResponse addAttachment(Long ticketId, MultipartFile file, Long userId);
}
