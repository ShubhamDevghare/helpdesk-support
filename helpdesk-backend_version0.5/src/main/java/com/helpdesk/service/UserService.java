package com.helpdesk.service;

import com.helpdesk.dto.request.PasswordChangeRequest;
import com.helpdesk.dto.request.PasswordResetRequest;
import com.helpdesk.dto.request.UserRegistrationRequest;
import com.helpdesk.dto.response.UserResponse;
import com.helpdesk.enums.Role;
import com.helpdesk.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {
    UserResponse registerUser(UserRegistrationRequest request);
    UserResponse getUserById(Long id);
    UserResponse getUserByEmail(String email);
    UserResponse updateUser(Long id, UserRegistrationRequest request);
    void deleteUser(Long id);
    void verifyEmail(String token);
    void initiatePasswordReset(PasswordResetRequest request);
    void resetPassword(PasswordChangeRequest request);
    UserResponse uploadProfileImage(Long userId, MultipartFile file);
    List<UserResponse> getUsersByRole(Role role);
    Page<UserResponse> searchUsersByRole(Role role, String searchTerm, Pageable pageable);
    void updateUserStatus(Long userId, UserStatus status);
    long countUsersByRoleAndStatus(Role role, UserStatus status);
}
