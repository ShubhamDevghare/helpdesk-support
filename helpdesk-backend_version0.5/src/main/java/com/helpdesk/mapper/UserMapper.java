// Enhanced UserMapper with agent details
package com.helpdesk.mapper;

import com.helpdesk.dto.request.UserRegistrationRequest;
import com.helpdesk.dto.response.UserResponse;
import com.helpdesk.entity.User;
import com.helpdesk.entity.Customer;
import com.helpdesk.entity.Agent;
import com.helpdesk.entity.Admin;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) return null;
        
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setProfileImageUrl(user.getProfileImageUrl());
        response.setRole(user.getRole());
        response.setStatus(user.getStatus());
        response.setEmailVerified(user.getEmailVerified());
        response.setCreatedAt(user.getCreatedAt());
        response.setLastLogin(user.getLastLogin());
        
        // Add agent-specific details
        if (user instanceof Agent) {
            Agent agent = (Agent) user;
            response.setEmployeeId(agent.getEmployeeId());
            response.setDepartments(agent.getDepartments());
        }
        
        return response;
    }

    public User toEntity(UserRegistrationRequest request) {
        if (request == null) return null;

        User user;
        switch (request.getRole()) {
            case CUSTOMER:
                Customer customer = new Customer();
                customer.setCompanyName(request.getCompanyName());
                customer.setAddress(request.getAddress());
                user = customer;
                break;
            case AGENT:
                Agent agent = new Agent();
                agent.setEmployeeId(request.getEmployeeId());
                agent.setDepartments(request.getDepartments());
                user = agent;
                break;
            case ADMIN:
                user = new Admin();
                break;
            default:
                user = new User();
        }

        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole());
        return user;
    }
}