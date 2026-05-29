package com.elearning.backend.service;

import com.elearning.backend.entity.Role;
import com.elearning.backend.entity.User;
import com.elearning.backend.exception.ResourceNotFoundException;
import com.elearning.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<User> getAllInstructors() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.INSTRUCTOR)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveUserAccess(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setApproved(true);
        userRepository.save(user);
    }

    @Transactional
    public void revokeUserAccess(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setApproved(false);
        userRepository.save(user);
    }
}
