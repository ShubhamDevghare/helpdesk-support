package com.helpdesk.controller;

import com.helpdesk.dto.request.UserRegistrationRequest;
import com.helpdesk.dto.response.AgentPerformanceResponse;
import com.helpdesk.dto.response.CustomerSatisfactionResponse;
import com.helpdesk.dto.response.UserResponse;
import com.helpdesk.service.AdminService;
import com.helpdesk.service.ReportingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.helpdesk.dto.request.AgentUpdateRequest;
import com.helpdesk.dto.request.TicketEscalationRequest;
import com.helpdesk.enums.UserStatus;
import com.helpdesk.dto.response.TicketResponse;
import com.helpdesk.service.TicketService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final ReportingService reportingService;
    private final TicketService ticketService;

    // Agent Management
    @PostMapping("/agents")
    public ResponseEntity<UserResponse> createAgent(@Valid @RequestBody UserRegistrationRequest request) {
        UserResponse agent = adminService.createAgent(request);
        return ResponseEntity.ok(agent);
    }

    @PutMapping("/agents/{id}")
    public ResponseEntity<UserResponse> updateAgent(
            @PathVariable Long id,
            @Valid @RequestBody AgentUpdateRequest request) {
        UserResponse updatedAgent = adminService.updateAgent(id, request);
        return ResponseEntity.ok(updatedAgent);
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<Void> updateUserStatus(
            @PathVariable Long id,
            @RequestParam UserStatus status) {
        adminService.updateUserStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/agents")
    public ResponseEntity<Page<UserResponse>> getAllAgents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<UserResponse> agents = adminService.getAllAgents(pageable);
        return ResponseEntity.ok(agents);
    }

    @GetMapping("/agents/search")
    public ResponseEntity<Page<UserResponse>> searchAgents(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserResponse> agents = adminService.searchAgents(searchTerm, pageable);
        return ResponseEntity.ok(agents);
    }

    @GetMapping("/agents/{id}/tickets")
    public ResponseEntity<Page<Object>> getAgentTickets(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Object> tickets = adminService.getAgentTickets(id, pageable);
        return ResponseEntity.ok(tickets);
    }

    // Customer Management
    @GetMapping("/customers")
    public ResponseEntity<Page<UserResponse>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<UserResponse> customers = adminService.getAllCustomers(pageable);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/customers/search")
    public ResponseEntity<Page<UserResponse>> searchCustomers(
            @RequestParam String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserResponse> customers = adminService.searchCustomers(searchTerm, pageable);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/customers/{id}/tickets")
    public ResponseEntity<Page<Object>> getCustomerTickets(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Object> tickets = adminService.getCustomerTickets(id, pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/customers/{id}/resolved-tickets")
    public ResponseEntity<Page<Object>> getCustomerResolvedTickets(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("resolvedAt").descending());
        Page<Object> tickets = adminService.getCustomerResolvedTickets(id, pageable);
        return ResponseEntity.ok(tickets);
    }

    // Reporting
    @GetMapping("/reports/agent-performance")
    public ResponseEntity<List<AgentPerformanceResponse>> getAgentPerformanceReport() {
        List<AgentPerformanceResponse> report = reportingService.getAgentPerformanceReport();
        return ResponseEntity.ok(report);
    }

    @GetMapping("/reports/agent-performance/{agentId}")
    public ResponseEntity<AgentPerformanceResponse> getAgentPerformance(@PathVariable Long agentId) {
        AgentPerformanceResponse performance = reportingService.getAgentPerformance(agentId);
        return ResponseEntity.ok(performance);
    }

    @GetMapping("/reports/customer-satisfaction")
    public ResponseEntity<CustomerSatisfactionResponse> getCustomerSatisfactionReport() {
        CustomerSatisfactionResponse report = reportingService.getCustomerSatisfactionReport();
        return ResponseEntity.ok(report);
    }

    @GetMapping("/reports/export/excel")
    public ResponseEntity<byte[]> exportReportToExcel(@RequestParam String reportType) {
        byte[] excelData = reportingService.exportToExcel(reportType);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=report.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excelData);
    }

    @GetMapping("/reports/export/pdf")
    public ResponseEntity<byte[]> exportReportToPdf(@RequestParam String reportType) {
        byte[] pdfData = reportingService.exportToPdf(reportType);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=report.pdf")
                .header("Content-Type", "application/pdf")
                .body(pdfData);
    }

    // Dashboard Stats
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Object> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/escalated-tickets")
    public ResponseEntity<Page<Object>> getEscalatedTickets(
            @RequestParam Long adminId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("escalatedAt").descending());
        Page<Object> tickets = adminService.getEscalatedTickets(adminId, pageable);
        return ResponseEntity.ok(tickets);
    }

    @PostMapping("/tickets/{ticketId}/escalate-to-agent")
    public ResponseEntity<TicketResponse> escalateTicketToAgent(
            @PathVariable String ticketId,
            @RequestBody TicketEscalationRequest request,
            @RequestParam Long adminId) {
    	System.out.println("==========================@@@@@@@@@@@@@@@@@@@================================");
    	System.out.println("===== ticketId :"+ ticketId+"===== adminId :"+adminId+"===== request :"+request.getEscalateToAgentId()+","+request.getEscalationReason()+","+request.getEscalateToAdminId());
        TicketResponse ticket = ticketService.escalateTicketToAgent(ticketId, request, adminId);
        return ResponseEntity.ok(ticket);
    }
}
