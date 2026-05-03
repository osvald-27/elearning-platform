package com.elearning.backend.entity;

public abstract class User {
    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private boolean approved;
}
