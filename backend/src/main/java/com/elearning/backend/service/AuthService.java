package com.elearning.backend.service;

import com.elearning.backend.dto.LoginRequest;
import com.elearning.backend.dto.LoginResponse;
import com.elearning.backend.dto.RegisterRequest;
import com.elearning.backend.dto.MessageResponse;
import com.elearning.backend.entity.Admin;
import com.elearning.backend.entity.Instructor;
import com.elearning.backend.entity.Role;
import com.elearning.backend.entity.Student;
import com.elearning.backend.entity.User;
import com.elearning.backend.exception.AccountNotApprovedException;
import com.elearning.backend.exception.EmailAlreadyExistsException;
import com.elearning.backend.exception.InvalidCredentialsException;
import com.elearning.backend.repository.UserRepository;
import com.elearning.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidCredentialsException("Invalid role");
        }

        User user;
        switch (role) {
            case STUDENT -> user = new Student();
            case INSTRUCTOR -> user = new Instructor();
            case ADMIN -> user = new Admin();
            default -> throw new InvalidCredentialsException("Invalid role");
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        return new MessageResponse("User registered successfully");
    }

    public LoginResponse login(LoginRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        if (userOptional.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOptional.get().getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        User user = userOptional.get();

        if (!user.getApproved()) {
            throw new AccountNotApprovedException("Account pending admin approval");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole().toString());
        return new LoginResponse(token, user.getRole().toString(), user.getId(), user.getFullName());
    }
}

