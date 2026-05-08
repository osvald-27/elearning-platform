package com.elearning.backend.dto;

public class AuthResponse {
    private String message;
    private String email;
    private String role;

    //Constructor
    public AuthResponse(String message, String email, String role) {
        this.message = message;
        this.email = email;
        this.role = role;
    }
    
    //setters
    public String getMessage(){
        return message;
    }
    public String getEmail() {
        return email;
    }
    public String getRole() {
        return role;
    }


}
