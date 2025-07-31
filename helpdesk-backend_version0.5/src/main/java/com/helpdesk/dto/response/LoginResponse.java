// Enhanced LoginResponse with agent details
package com.helpdesk.dto.response;

import java.util.Set;

import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private String tokenType = "Bearer";
    private UserResponse user;
    private Long expiresIn;
    
    // Additional fields for agent login
    private String employeeId;
    private Set<String> departments; // Changed from String department to Set<String> departments
}