package com.helpdesk.service.impl;

import com.helpdesk.dto.response.TicketResponse;
import com.helpdesk.entity.Agent;
import com.helpdesk.enums.AgentStatus;
import com.helpdesk.enums.TicketStatus;
import com.helpdesk.exception.ResourceNotFoundException;
import com.helpdesk.mapper.TicketMapper;
import com.helpdesk.repository.AgentRepository;
import com.helpdesk.repository.TicketRepository;
import com.helpdesk.service.AgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentServiceImpl implements AgentService {

    private final AgentRepository agentRepository;
    private final TicketRepository ticketRepository;
    private final TicketMapper ticketMapper;

    @Override
    @Transactional
    public void updateAgentStatus(String employeeId, AgentStatus status) {
        Agent agent = agentRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + employeeId));
        
        agent.setAgentStatus(status);
        agentRepository.save(agent);
        
        log.info("Agent status updated to {} for agent: {}", status, agent.getEmail());
    }

    @Override
    public AgentStatus getAgentStatus(String employeeId) {
        Agent agent = agentRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + employeeId));
        
        return agent.getAgentStatus();
    }

    @Override
    public Page<TicketResponse> getAssignedTickets(Long agentId, Pageable pageable) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + agentId));
        
        return ticketRepository.findByAssignedAgent(agent, pageable)
                .map(ticketMapper::toResponse);
    }

    @Override
    public Page<TicketResponse> searchAssignedTickets(Long agentId, String searchTerm, Pageable pageable) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + agentId));
        
        return ticketRepository.findByAssignedAgentAndSearchTerm(agent, searchTerm, pageable)
                .map(ticketMapper::toResponse);
    }

    @Override
    public Page<TicketResponse> getEscalatedTickets(Long agentId, Pageable pageable) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + agentId));
        
        return ticketRepository.findByEscalatedToAgent(agent, pageable)
                .map(ticketMapper::toResponse);
    }

    @Override
    public Object getAgentPerformance(Long agentId) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + agentId));
        
        Map<String, Object> performance = new HashMap<>();
        
        // Basic metrics
        long totalAssigned = ticketRepository.countByAssignedAgent(agent);
        long totalResolved = ticketRepository.countResolvedByAgent(agent);
        Double avgResolutionTime = ticketRepository.getAverageResolutionTimeByAgent(agent);
        Double avgRating = ticketRepository.getAverageRatingByAgent(agent);
        
        performance.put("totalAssigned", totalAssigned);
        performance.put("totalResolved", totalResolved);
        performance.put("resolutionRate", totalAssigned > 0 ? (double) totalResolved / totalAssigned * 100 : 0);
        performance.put("averageResolutionTime", avgResolutionTime != null ? avgResolutionTime : 0);
        performance.put("averageRating", avgRating != null ? avgRating : 0);
        
        // Performance Score Calculation
        double resolutionRate = totalAssigned > 0 ? (double) totalResolved / totalAssigned : 0;
        double ratingScore = avgRating != null ? avgRating / 5.0 : 0;
        double timeScore = avgResolutionTime != null && avgResolutionTime > 0 ? 1.0 / avgResolutionTime : 0;
        
        // Normalize time score (assuming 24 hours is baseline)
        timeScore = Math.min(timeScore * 24, 1.0);
        
        double performanceScore = (resolutionRate * 0.4) + (ratingScore * 0.4) + (timeScore * 0.2);
        performance.put("performanceScore", Math.round(performanceScore * 100.0) / 100.0);
        
        // Performance Grade
        String grade;
        if (performanceScore >= 0.9) grade = "A+";
        else if (performanceScore >= 0.8) grade = "A";
        else if (performanceScore >= 0.7) grade = "B";
        else if (performanceScore >= 0.6) grade = "C";
        else grade = "D";
        
        performance.put("performanceGrade", grade);
        
        return performance;
    }

    @Override
    public Object getAgentDashboardStats(String employeeId) {
        Agent agent = agentRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + employeeId));
        
        Map<String, Object> stats = new HashMap<>();
        
        // Ticket counts by status
        long openTickets = ticketRepository.findByAssignedAgentAndStatus(agent, TicketStatus.OPEN, null).getTotalElements();
        long inProgressTickets = ticketRepository.findByAssignedAgentAndStatus(agent, TicketStatus.IN_PROGRESS, null).getTotalElements();
        long resolvedTickets = ticketRepository.findByAssignedAgentAndStatus(agent, TicketStatus.RESOLVED, null).getTotalElements();
        long totalAssigned = ticketRepository.countByAssignedAgent(agent);
        
        stats.put("openTickets", openTickets);
        stats.put("inProgressTickets", inProgressTickets);
        stats.put("resolvedTickets", resolvedTickets);
        stats.put("totalAssigned", totalAssigned);
        
        // Priority breakdown
        long highPriorityTickets = ticketRepository.findByAssignedAgentAndPriority(
            agent, com.helpdesk.enums.Priority.HIGH, null).getTotalElements();
        long mediumPriorityTickets = ticketRepository.findByAssignedAgentAndPriority(
            agent, com.helpdesk.enums.Priority.MEDIUM, null).getTotalElements();
        long lowPriorityTickets = ticketRepository.findByAssignedAgentAndPriority(
            agent, com.helpdesk.enums.Priority.LOW, null).getTotalElements();
        
        stats.put("highPriorityTickets", highPriorityTickets);
        stats.put("mediumPriorityTickets", mediumPriorityTickets);
        stats.put("lowPriorityTickets", lowPriorityTickets);
        
        // Recent activity
        LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
        long recentTickets = agent.getAssignedTickets().stream()
                .mapToLong(ticket -> ticket.getCreatedAt().isAfter(last24Hours) ? 1 : 0)
                .sum();
        
        stats.put("recentTickets", recentTickets);
        
        // Agent status and departments
        stats.put("agentStatus", agent.getAgentStatus());
        stats.put("departments", agent.getDepartments());
        
        // Escalated tickets count
        long escalatedToMe = ticketRepository.findByEscalatedToAgent(agent).size();
        stats.put("escalatedToMe", escalatedToMe);
        
        return stats;
    }

    @Override
    public String generateEmployeeId() {
        String year = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy"));
        String pattern = "EMP-" + year + "-%";
        
        long count = agentRepository.countByEmployeeIdPattern(pattern);
        String sequentialNumber = String.format("%04d", count + 1);
        
        String employeeId = "EMP-" + year + "-" + sequentialNumber;
        
        // Ensure uniqueness
        while (agentRepository.findByEmployeeId(employeeId).isPresent()) {
            count++;
            sequentialNumber = String.format("%04d", count + 1);
            employeeId = "EMP-" + year + "-" + sequentialNumber;
        }
        
        return employeeId;
    }
}
