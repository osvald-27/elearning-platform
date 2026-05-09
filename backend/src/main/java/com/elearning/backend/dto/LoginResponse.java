package com.elearning.backend.dto;

public class LoginResponse {
    private String token;
    private String role;
    private Long userId;
    private String fullName;

    public LoginResponse(String token, String role, Long userId, String fullName) {
        this.token = token;
        this.role = role;
        this.userId = userId;
        this.fullName = fullName;
    }

    // Getters
    public String getToken() {
        return token;
    }

    public String getRole() {
        return role;
    }

    public Long getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }
}
