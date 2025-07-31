// Enhanced UserServiceImpl with auto employee ID generation
package com.helpdesk.service.impl;

import com.helpdesk.dto.request.PasswordChangeRequest;
import com.helpdesk.dto.request.PasswordResetRequest;
import com.helpdesk.dto.request.UserRegistrationRequest;
import com.helpdesk.dto.response.UserResponse;
import com.helpdesk.entity.User;
import com.helpdesk.entity.Agent;
import com.helpdesk.enums.Role;
import com.helpdesk.enums.UserStatus;
import com.helpdesk.exception.ResourceNotFoundException;
import com.helpdesk.exception.BadRequestException;
import com.helpdesk.mapper.UserMapper;
import com.helpdesk.repository.UserRepository;
import com.helpdesk.service.UserService;
import com.helpdesk.service.AgentService;
import com.helpdesk.service.EmailService;
import com.helpdesk.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final CloudinaryService cloudinaryService;
    private final AgentService agentService;

    @Override
    @Transactional
    public UserResponse registerUser(UserRegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        user.setVerificationToken(UUID.randomUUID().toString());

        // Auto-generate employee ID for agents
        if (user instanceof Agent) {
            Agent agent = (Agent) user;
            if (agent.getEmployeeId() == null || agent.getEmployeeId().isEmpty()) {
                agent.setEmployeeId(agentService.generateEmployeeId());
            }
        }

        User savedUser = userRepository.save(user);
        
        // Send verification email
        emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getVerificationToken());
        
        log.info("User registered successfully: {}", savedUser.getEmail());
        return userMapper.toResponse(savedUser);
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return userMapper.toResponse(user);
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserRegistrationRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());

        User updatedUser = userRepository.save(user);
        return userMapper.toResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
        log.info("User deleted successfully: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        user.setEmailVerified(true);
        user.setStatus(UserStatus.ACTIVE);
        user.setVerificationToken(null);
        userRepository.save(user);
        
        log.info("Email verified successfully for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void initiatePasswordReset(PasswordResetRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
        log.info("Password reset initiated for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void resetPassword(PasswordChangeRequest request) {
        User user = userRepository.findByResetToken(request.getResetToken())
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        emailService.sendPasswordChangeConfirmation(user.getEmail());
        log.info("Password reset successfully for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public UserResponse uploadProfileImage(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String imageUrl = cloudinaryService.uploadImage(file);
        user.setProfileImageUrl(imageUrl);
        User updatedUser = userRepository.save(user);
        
        return userMapper.toResponse(updatedUser);
    }

    @Override
    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<UserResponse> searchUsersByRole(Role role, String searchTerm, Pageable pageable) {
        return userRepository.findByRoleAndSearchTerm(role, searchTerm, pageable)
                .map(userMapper::toResponse);
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
    public long countUsersByRoleAndStatus(Role role, UserStatus status) {
        return userRepository.countByRoleAndStatus(role, status);
    }
}