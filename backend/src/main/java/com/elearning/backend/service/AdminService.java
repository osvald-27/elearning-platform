package com.elearning.backend.service;

import com.elearning.backend.dto.MessageResponse;
import com.elearning.backend.entity.User;
import com.elearning.backend.exception.ResourceNotFoundException;
import com.elearning.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingUsers() {
        return userRepository.findAllByApprovedFalse()
                .stream()
                .map(this::toMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toMap)
                .toList();
    }

    @Transactional
    public MessageResponse approveUser(Long userId, Long adminId) {
        if (userId.equals(adminId)) {
            throw new IllegalArgumentException("Admins cannot approve themselves");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setApproved(true);
        userRepository.save(user);
        return new MessageResponse(user.getFullName() + " has been approved and can now log in.");
    }

    @Transactional
    public MessageResponse rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setApproved(false);
        userRepository.save(user);
        return new MessageResponse(user.getFullName() + " has been rejected/disabled.");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers",   userRepository.count());
        stats.put("pendingUsers", userRepository.findAllByApprovedFalse().size());
        return stats;
    }

    private Map<String, Object> toMap(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",        u.getId());
        m.put("fullName",  u.getFullName());
        m.put("email",     u.getEmail());
        m.put("role",      u.getRole().name());
        m.put("approved",  u.getApproved());
        m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
        return m;
    }
}
