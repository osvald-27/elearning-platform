package com.elearning.backend.dto;

public class LoginRequest {
    private String email;
    private String password;
    private String role;

    //getters
    public String getEmail() {
        return email;
    }
    public String getPassword() {
        return password;
    }
    public String getRole() {
        return role;
    }
    
    //setters
    public void setEmail(String email){
        this.email = email;
    }
    public void setPassword(String password){
        this.password = password;
    }


}
