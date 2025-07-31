package com.helpdesk.controller;

import com.helpdesk.dto.request.TicketCreateRequest;
import com.helpdesk.dto.request.TicketUpdateRequest;
import com.helpdesk.dto.request.TicketRatingRequest;
import com.helpdesk.dto.response.TicketResponse;
import com.helpdesk.enums.Priority;
import com.helpdesk.enums.TicketCategory;
import com.helpdesk.enums.TicketStatus;
import com.helpdesk.security.UserPrincipal;
import com.helpdesk.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<TicketResponse> createTicket(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody TicketCreateRequest request) {
        TicketResponse ticket = ticketService.createTicket(request, currentUser.getId());
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable Long id) {
        TicketResponse ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/ticket-id/{ticketId}")
    public ResponseEntity<TicketResponse> getTicketByTicketId(@PathVariable String ticketId) {
        TicketResponse ticket = ticketService.getTicketByTicketId(ticketId);
        return ResponseEntity.ok(ticket);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('AGENT') or hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> updateTicket(
            @PathVariable Long id,
            @Valid @RequestBody TicketUpdateRequest request) {
        TicketResponse ticket = ticketService.updateTicket(id, request);
        return ResponseEntity.ok(ticket);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.ok("Ticket deleted successfully");
    }

    @GetMapping("/my-tickets")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<TicketResponse>> getMyTickets(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) TicketStatus status) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<TicketResponse> tickets = ticketService.getTicketsByCustomer(currentUser.getId(), pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/assigned-to-me")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<Page<TicketResponse>> getAssignedTickets(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Priority priority) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<TicketResponse> tickets = ticketService.getTicketsByAgent(currentUser.getId(), pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<TicketResponse>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) TicketCategory category) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<TicketResponse> tickets = ticketService.getAllTickets(pageable);
        return ResponseEntity.ok(tickets);
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable Long id,
            @RequestParam Long agentId) {
        TicketResponse ticket = ticketService.assignTicket(id, agentId);
        return ResponseEntity.ok(ticket);
    }

    @PutMapping("/{id}/escalate")
    @PreAuthorize("hasRole('AGENT') or hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> escalateTicket(@PathVariable Long id) {
        TicketResponse ticket = ticketService.escalateTicket(id);
        return ResponseEntity.ok(ticket);
    }

    @PutMapping("/{id}/reopen")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<TicketResponse> reopenTicket(@PathVariable Long id) {
        TicketResponse ticket = ticketService.reopenTicket(id);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{id}/rate")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<TicketResponse> rateTicket(
            @PathVariable Long id,
            @Valid @RequestBody TicketRatingRequest request) {
        TicketResponse ticket = ticketService.rateTicket(id, request);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<TicketResponse> addAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TicketResponse ticket = ticketService.addAttachment(id, file, currentUser.getId());
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TicketResponse>> getOverdueTickets() {
        List<TicketResponse> tickets = ticketService.getOverdueTickets();
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('AGENT') or hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> searchTicketById(@RequestParam String ticketId) {
        TicketResponse ticket = ticketService.getTicketByTicketId(ticketId);
        return ResponseEntity.ok(ticket);
    }
}
