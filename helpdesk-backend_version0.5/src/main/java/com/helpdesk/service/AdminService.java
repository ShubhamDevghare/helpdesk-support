package com.helpdesk.service;

import com.helpdesk.dto.request.AgentUpdateRequest;
import com.helpdesk.dto.request.UserRegistrationRequest;
import com.helpdesk.dto.response.UserResponse;
import com.helpdesk.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminService {
    UserResponse createAgent(UserRegistrationRequest request);
    UserResponse updateAgent(Long agentId, AgentUpdateRequest request);
    void updateUserStatus(Long userId, UserStatus status);
    Page<UserResponse> getAllAgents(Pageable pageable);
    Page<UserResponse> searchAgents(String searchTerm, Pageable pageable);
    Page<Object> getAgentTickets(Long agentId, Pageable pageable);
    Page<UserResponse> getAllCustomers(Pageable pageable);
    Page<UserResponse> searchCustomers(String searchTerm, Pageable pageable);
    Page<Object> getCustomerTickets(Long customerId, Pageable pageable);
    Page<Object> getCustomerResolvedTickets(Long customerId, Pageable pageable);
    Page<Object> getEscalatedTickets(Long adminId, Pageable pageable);
    Object getDashboardStats();
}
