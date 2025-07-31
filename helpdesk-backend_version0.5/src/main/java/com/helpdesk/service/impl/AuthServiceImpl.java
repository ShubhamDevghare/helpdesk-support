// Enhanced AuthServiceImpl with agent details in login response
package com.helpdesk.service.impl;

import com.helpdesk.dto.request.LoginRequest;
import com.helpdesk.dto.response.LoginResponse;
import com.helpdesk.entity.User;
import com.helpdesk.entity.Agent;
import com.helpdesk.mapper.UserMapper;
import com.helpdesk.repository.UserRepository;
import com.helpdesk.security.JwtTokenProvider;
import com.helpdesk.service.AuthService;
import com.helpdesk.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final EmailService emailService;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        // Update last login time
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Send login notification email
        String userType = user.getRole().name().toLowerCase();
        if (!userType.equals("customer")) {
            emailService.sendLoginNotificationEmail(user.getEmail(), userType);
        }

        LoginResponse response = new LoginResponse();
        response.setToken(jwt);
        response.setUser(userMapper.toResponse(user));
        response.setExpiresIn(86400L); // 24 hours in seconds

        // Add agent-specific details if user is an agent
        if (user instanceof Agent) {
            Agent agent = (Agent) user;
            response.setEmployeeId(agent.getEmployeeId());
            response.setDepartments(agent.getDepartments());
        }

        log.info("User logged in successfully: {}", user.getEmail());
        return response;
    }

    @Override
    public void logout(String token) {
        // In a production environment, you might want to blacklist the token
        SecurityContextHolder.clearContext();
        log.info("User logged out successfully");
    }

    @Override
    public LoginResponse refreshToken(String refreshToken) {
        // Implementation for refresh token logic
        // This is a simplified version - in production, you'd have separate refresh tokens
        if (tokenProvider.validateToken(refreshToken)) {
            String email = tokenProvider.getEmailFromToken(refreshToken);
            String newToken = tokenProvider.generateTokenFromEmail(email);
            
            User user = userRepository.findByEmail(email).orElseThrow();
            
            LoginResponse response = new LoginResponse();
            response.setToken(newToken);
            response.setUser(userMapper.toResponse(user));
            response.setExpiresIn(86400L);
            
            // Add agent-specific details if user is an agent
            if (user instanceof Agent) {
                Agent agent = (Agent) user;
                response.setEmployeeId(agent.getEmployeeId());
                response.setDepartments(agent.getDepartments());
            }
            
            return response;
        }
        throw new RuntimeException("Invalid refresh token");
    }
}