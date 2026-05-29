package com.elearning.backend.controller;

import com.elearning.backend.dto.MessageResponse;
import com.elearning.backend.entity.User;
import com.elearning.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/instructors")
    public ResponseEntity<List<User>> getAllInstructors() {
        return ResponseEntity.ok(adminService.getAllInstructors());
    }

    @PutMapping("/users/{userId}/approve")
    public ResponseEntity<MessageResponse> approveUser(@PathVariable Long userId) {
        adminService.approveUserAccess(userId);
        return ResponseEntity.ok(new MessageResponse("User access approved successfully"));
    }

    @PutMapping("/users/{userId}/revoke")
    public ResponseEntity<MessageResponse> revokeUser(@PathVariable Long userId) {
        adminService.revokeUserAccess(userId);
        return ResponseEntity.ok(new MessageResponse("User access revoked successfully"));
    }
}
