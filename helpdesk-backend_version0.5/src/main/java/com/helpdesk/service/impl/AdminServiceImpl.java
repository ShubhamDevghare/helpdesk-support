package com.helpdesk.service.impl;

import com.helpdesk.dto.request.AgentUpdateRequest;
import com.helpdesk.dto.request.UserRegistrationRequest;
import com.helpdesk.dto.response.UserResponse;
import com.helpdesk.entity.Agent;
import com.helpdesk.entity.Customer;
import com.helpdesk.entity.User;
import com.helpdesk.enums.Role;
import com.helpdesk.enums.TicketStatus;
import com.helpdesk.enums.UserStatus;
import com.helpdesk.exception.ResourceNotFoundException;
import com.helpdesk.mapper.TicketMapper;
import com.helpdesk.mapper.UserMapper;
import com.helpdesk.repository.AgentRepository;
import com.helpdesk.repository.CustomerRepository;
import com.helpdesk.repository.TicketRepository;
import com.helpdesk.repository.UserRepository;
import com.helpdesk.service.AdminService;
import com.helpdesk.service.AgentService;
import com.helpdesk.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserService userService;
    private final AgentService agentService;
    private final UserRepository userRepository;
    private final AgentRepository agentRepository;
    private final CustomerRepository customerRepository;
    private final TicketRepository ticketRepository;
    private final UserMapper userMapper;
    private final TicketMapper ticketMapper;

    @Override
    @Transactional
    public UserResponse createAgent(UserRegistrationRequest request) {
        request.setRole(Role.AGENT);
        UserResponse agentResponse = userService.registerUser(request);
        
        // Generate and set employee ID
        Agent agent = agentRepository.findById(agentResponse.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));
        
        if (agent.getEmployeeId() == null || agent.getEmployeeId().isEmpty()) {
            agent.setEmployeeId(agentService.generateEmployeeId());
            agentRepository.save(agent);
            agentResponse.setEmployeeId(agent.getEmployeeId());
        }
        
        log.info("Agent created by admin: {} with employee ID: {}", request.getEmail(), agent.getEmployeeId());
        return agentResponse;
    }

    @Override
    @Transactional
    public UserResponse updateAgent(Long agentId, AgentUpdateRequest request) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + agentId));

        // Update basic user information
        if (request.getFirstName() != null) {
            agent.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            agent.setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            agent.setPhoneNumber(request.getPhoneNumber());
        }
        
        // Update departments
        if (request.getDepartments() != null) {
            agent.setDepartments(request.getDepartments());
        }
        
        // Update agent status
        if (request.getAgentStatus() != null) {
            agent.setAgentStatus(request.getAgentStatus());
        }
        
        // Update user status
        if (request.getUserStatus() != null) {
            agent.setStatus(request.getUserStatus());
        }

        Agent updatedAgent = agentRepository.save(agent);
        log.info("Agent updated: {} by admin", agent.getEmail());
        
        return userMapper.toResponse(updatedAgent);
    }

    @Override
    @Transactional
    public void updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        user.setStatus(status);
        userRepository.save(user);
        
        log.info("User status updated to {} for user: {}", status, user.getEmail());
    }

    @Override
    public Page<UserResponse> getAllAgents(Pageable pageable) {
        return userRepository.findByRole(Role.AGENT, pageable)
                .map(userMapper::toResponse);
    }

    @Override
    public Page<UserResponse> searchAgents(String searchTerm, Pageable pageable) {
        return userRepository.findByRoleAndSearchTerm(Role.AGENT, searchTerm, pageable)
                .map(userMapper::toResponse);
    }

    @Override
    public Page<Object> getAgentTickets(Long agentId, Pageable pageable) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + agentId));
        
        return ticketRepository.findByAssignedAgent(agent, pageable)
                .map(ticket -> (Object) ticketMapper.toResponse(ticket));
    }

    @Override
    public Page<UserResponse> getAllCustomers(Pageable pageable) {
        return userRepository.findByRole(Role.CUSTOMER, pageable)
                .map(userMapper::toResponse);
    }

    @Override
    public Page<UserResponse> searchCustomers(String searchTerm, Pageable pageable) {
        return userRepository.findByRoleAndSearchTerm(Role.CUSTOMER, searchTerm, pageable)
                .map(userMapper::toResponse);
    }

    @Override
    public Page<Object> getCustomerTickets(Long customerId, Pageable pageable) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        
        return ticketRepository.findByCustomer(customer, pageable)
                .map(ticket -> (Object) ticketMapper.toResponse(ticket));
    }

    @Override
    public Page<Object> getCustomerResolvedTickets(Long customerId, Pageable pageable) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        
        return ticketRepository.findByCustomerAndStatus(customer, TicketStatus.RESOLVED, pageable)
                .map(ticket -> (Object) ticketMapper.toResponse(ticket));
    }

    @Override
    public Page<Object> getEscalatedTickets(Long adminId, Pageable pageable) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with id: " + adminId));
        
        return ticketRepository.findByEscalatedToAdmin(admin, pageable)
                .map(ticket -> (Object) ticketMapper.toResponse(ticket));
    }

    @Override
    public Object getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // User Statistics
        long totalCustomers = userRepository.countByRoleAndStatus(Role.CUSTOMER, UserStatus.ACTIVE);
        long totalAgents = userRepository.countByRoleAndStatus(Role.AGENT, UserStatus.ACTIVE);
        long totalAdmins = userRepository.countByRoleAndStatus(Role.ADMIN, UserStatus.ACTIVE);
        
        stats.put("totalCustomers", totalCustomers);
        stats.put("totalAgents", totalAgents);
        stats.put("totalAdmins", totalAdmins);
        stats.put("totalUsers", totalCustomers + totalAgents + totalAdmins);
        
        // Ticket Statistics
        long totalTickets = ticketRepository.count();
        long openTickets = ticketRepository.findByStatus(TicketStatus.OPEN).size();
        long inProgressTickets = ticketRepository.findByStatus(TicketStatus.IN_PROGRESS).size();
        long resolvedTickets = ticketRepository.findByStatus(TicketStatus.RESOLVED).size();
        long closedTickets = ticketRepository.findByStatus(TicketStatus.CLOSED).size();
        
        stats.put("totalTickets", totalTickets);
        stats.put("openTickets", openTickets);
        stats.put("inProgressTickets", inProgressTickets);
        stats.put("resolvedTickets", resolvedTickets);
        stats.put("closedTickets", closedTickets);
        
        // Performance Metrics
        long overdueTickets = ticketRepository.findOverdueTickets(
            java.time.LocalDateTime.now().minusHours(24)).size();
        long escalatedTickets = ticketRepository.findByEscalated(true).size();
        
        stats.put("overdueTickets", overdueTickets);
        stats.put("escalatedTickets", escalatedTickets);
        
        // Satisfaction Metrics
        long totalRatings = ticketRepository.countTotalRatings();
        long positiveRatings = ticketRepository.countPositiveRatings();
        double satisfactionRate = totalRatings > 0 ? (double) positiveRatings / totalRatings * 100 : 0;
        
        stats.put("totalRatings", totalRatings);
        stats.put("positiveRatings", positiveRatings);
        stats.put("satisfactionRate", Math.round(satisfactionRate * 100.0) / 100.0);
        
        return stats;
    }
}
