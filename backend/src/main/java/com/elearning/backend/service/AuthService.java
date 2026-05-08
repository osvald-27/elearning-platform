package com.elearning.backend.service;

import java.util.HashMap;
import java.util.Map;

import com.elearning.backend.dto.AuthResponse;
import com.elearning.backend.dto.LoginRequest;
import com.elearning.backend.dto.RegisterRequest;

public class AuthService {
    private final Map<String, String> users = new HashMap<>();

    public AuthResponse register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new RuntimeException("Email already is use");
        }
        if (request.getRole() == null || (!request.getRole().equals("STUDENT") && !request.getRole().equals("INSTRUCTOR") && !request.getRole().equals("ADMIN") )) {
            throw new RuntimeException("You must be a STUDENT, INSTRUCTOR, ADMIN");
        }
        if (users.containsKey(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        String value = request.getPassword() + "|" + request.getRole() + "|" + request.getFullName();
        users.put(request.getEmail(), value);

        String message = request.getRole().equals("STUDENT")
            ? "Registered successfully"
            : "Registered. Pending admin approval.";
        return new AuthResponse(message, request.getEmail(), request.getRole());

    }

    public AuthResponse login(LoginRequest request) {
        if (!users.containsKey(request.getEmail())) {
            throw new RuntimeException("Invalid email or password");
        }
        return new AuthResponse("Login Successful", request.getEmail(), request.getRole());
    }
}
