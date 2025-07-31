package com.helpdesk.controller;

import com.helpdesk.dto.request.TicketEscalationRequest;
import com.helpdesk.dto.response.TicketResponse;
import com.helpdesk.enums.AgentStatus;
import com.helpdesk.service.AgentService;
import com.helpdesk.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/agent")
@PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;
    private final TicketService ticketService;

    @PutMapping("/{employeeId}/status")
    public ResponseEntity<Void> updateAgentStatus(
            @PathVariable String employeeId,
            @RequestParam AgentStatus status) {
        agentService.updateAgentStatus(employeeId, status);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{employeeId}/status")
    public ResponseEntity<AgentStatus> getAgentStatus(@PathVariable String employeeId) {
        AgentStatus status = agentService.getAgentStatus(employeeId);
        return ResponseEntity.ok(status);
    }

    @GetMapping("/{id}/tickets")
    public ResponseEntity<Page<TicketResponse>> getAssignedTickets(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<TicketResponse> tickets = agentService.getAssignedTickets(id, pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{id}/tickets/search")
    public ResponseEntity<Page<TicketResponse>> searchAssignedTickets(
            @PathVariable Long id,
            @RequestParam String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TicketResponse> tickets = agentService.searchAssignedTickets(id, searchTerm, pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{id}/escalated-tickets")
    public ResponseEntity<Page<TicketResponse>> getEscalatedTickets(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("escalatedAt").descending());
        Page<TicketResponse> tickets = agentService.getEscalatedTickets(id, pageable);
        return ResponseEntity.ok(tickets);
    }

//    @PostMapping("/tickets/{ticketId}/escalate-to-admin")
//    public ResponseEntity<TicketResponse> escalateTicketToAdmin(
//            @PathVariable Long ticketId,
//            @RequestBody TicketEscalationRequest request,
//            @RequestParam Long employeeId) {
//        TicketResponse ticket = ticketService.escalateTicketToAdmin(ticketId, request, employeeId);
//        return ResponseEntity.ok(ticket);
//    }
    
    @PostMapping("/tickets/{ticketId}/escalate-to-admin")
    public ResponseEntity<TicketResponse> escalateTicketToAdmin(
            @PathVariable String ticketId,
            @RequestBody TicketEscalationRequest request) {
    	
        // Set default admin ID if not provided
        if (request.getEscalateToAdminId() == null) {
            request.setEscalateToAdminId(2L);  // Default admin ID
        }

        TicketResponse ticket = ticketService.escalateTicketToAdmin(
            ticketId,
            request,
            request.getEscalateToAgentId()
        );
        return ResponseEntity.ok(ticket);
    }


    @GetMapping("/{id}/performance")
    public ResponseEntity<Object> getAgentPerformance(@PathVariable Long id) {
        Object performance = agentService.getAgentPerformance(id);
        return ResponseEntity.ok(performance);
    }

    @GetMapping("/{employeeId}/dashboard/stats")
    public ResponseEntity<Object> getAgentDashboardStats(@PathVariable String employeeId) {
        Object stats = agentService.getAgentDashboardStats(employeeId);
        return ResponseEntity.ok(stats);
    }
}
