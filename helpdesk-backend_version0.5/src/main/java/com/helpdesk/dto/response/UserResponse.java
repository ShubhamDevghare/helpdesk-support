// Enhanced UserResponse with agent details
package com.helpdesk.dto.response;

import com.helpdesk.enums.Role;
import com.helpdesk.enums.UserStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String profileImageUrl;
    private Role role;
    private UserStatus status;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    
    // Additional fields for agents
    private String employeeId;
    private Set<String> departments; // Changed from String department to Set<String> departments
}