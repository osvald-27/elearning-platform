package com.elearning.backend.service;

import com.elearning.backend.dto.MessageResponse;
import com.elearning.backend.entity.User;
import com.elearning.backend.exception.ForbiddenException;
import com.elearning.backend.exception.ResourceNotFoundException;
import com.elearning.backend.repository.CourseRepository;
import com.elearning.backend.repository.EnrollmentRepository;
import com.elearning.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingUsers() {
        return userRepository.findAllByApprovedFalse()
                .stream()
                .map(this::toUserMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toUserMap)
                .toList();
    }

    @Transactional
    public MessageResponse approveUser(Long userId, Long adminId) {
        if (userId.equals(adminId)) {
            throw new ForbiddenException("Admins cannot approve themselves");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setApproved(true);
        userRepository.save(user);
        return new MessageResponse(user.getFullName() + " has been approved");
    }

    @Transactional
    public MessageResponse rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setApproved(false);
        userRepository.save(user);
        return new MessageResponse(user.getFullName() + " has been rejected/disabled");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        long totalUsers      = userRepository.count();
        long pendingUsers    = userRepository.findAllByApprovedFalse().size();
        long totalCourses    = courseRepository.count();
        long publishedCourses = courseRepository.findAllByPublishedTrue().size();
        long totalEnrollments = enrollmentRepository.count();

        stats.put("totalUsers",       totalUsers);
        stats.put("pendingUsers",     pendingUsers);
        stats.put("totalCourses",     totalCourses);
        stats.put("publishedCourses", publishedCourses);
        stats.put("totalEnrollments", totalEnrollments);
        return stats;
    }

    private Map<String, Object> toUserMap(User u) {
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
