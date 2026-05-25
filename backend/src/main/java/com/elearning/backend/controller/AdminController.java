package com.elearning.backend.controller;

import com.elearning.backend.dto.MessageResponse;
import com.elearning.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // GET all pending users (approved=false)
    @GetMapping("/pending-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getPendingUsers() {
        return ResponseEntity.ok(adminService.getPendingUsers());
    }

    // PATCH approve a user
    @PatchMapping("/users/{userId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> approveUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal Long adminId) {
        return ResponseEntity.ok(adminService.approveUser(userId, adminId));
    }

    // PATCH reject / disable a user
    @PatchMapping("/users/{userId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> rejectUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.rejectUser(userId));
    }

    // GET all users (for admin user management table)
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    // GET platform stats
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }
}
