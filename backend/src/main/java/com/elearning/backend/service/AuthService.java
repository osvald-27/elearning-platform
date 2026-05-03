package com.elearning.backend.service;

import org.springframework.stereotype.Service;
import com.elearning.backend.dto.RegisterRequest;
import com.elearning.backend.dto.LoginRequest;
@Service
public class AuthService {
    public String register(RegisterRequest req) {
        return "register";
    }
    public String login(LoginRequest req) {
        return "login";
    }
}
