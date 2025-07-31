package com.helpdesk.service;

import com.helpdesk.dto.request.LoginRequest;
import com.helpdesk.dto.response.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    void logout(String token);
    LoginResponse refreshToken(String refreshToken);
}
