package com.elearning.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity 
@Table(name = "users")

@Inheritance(strategy = InheritanceType.SINGLE_TABLE)

@DiscriminatorColumn(
    name = "role",
    discriminatorType = DiscriminatorType.STRING
)
public abstract class User {

    //Entries from database
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
        name = "full_name",
        nullable = false,
        length = 150
    )
    private String fullName;

    @Column(
        nullable = false,
        unique = true,
        length = 255
    )
    private String email;

    @Column(
        name = "password_hash",
        nullable = false,
        length = 255
    )
    private String passwordHash;

    @Enumerated(EnumType.STRING)

    @Column(
        insertable = false,
        updatable = false
    )
    private Role role;

    @Column(nullable = false)
    private Boolean approved;

    @Column(
        name = "created_at",
        nullable = false
    )
    private LocalDateTime createdAt;

    //Constructor
    public User() {
        this.createdAt = LocalDateTime.now();
    }

    //getters
    public Long getId() {
        return id;
    }
    public String getFullName() {
        return fullName;
    }
    public String getEmail() {
        return email;
    }
    public String getPasswordHash() {
        return passwordHash;
    }
    public Role getRole() {
        return role;
    }
    public Boolean getApproved() {
        return approved;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    //setters
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
    public void setApproved(Boolean approved)  {
        this.approved = approved;
    }
    
    
    
}
