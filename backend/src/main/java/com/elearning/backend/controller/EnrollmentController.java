package com.elearning.backend.controller;

import com.elearning.backend.dto.EnrollmentResponse;
import com.elearning.backend.dto.EnrollmentStatusResponse;
import com.elearning.backend.dto.MessageResponse;
import com.elearning.backend.service.EnrollmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    @Autowired
    private EnrollmentService enrollmentService;

    // POST /api/enrollments/{courseId} — enroll in a course
    @PostMapping("/{courseId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<MessageResponse> enroll(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(enrollmentService.enroll(courseId, userId));
    }

    // PATCH /api/enrollments/{courseId}/drop — drop a course
    @PatchMapping("/{courseId}/drop")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<MessageResponse> drop(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(enrollmentService.drop(courseId, userId));
    }

    // GET /api/enrollments/my-courses — all active enrollments for current student
    @GetMapping("/my-courses")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<EnrollmentResponse>> getMyCourses(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(enrollmentService.getMyCourses(userId));
    }

    // GET /api/enrollments/{courseId}/status — enrollment status for one course
    @GetMapping("/{courseId}/status")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<EnrollmentStatusResponse> getStatus(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentStatus(courseId, userId));
    }
}
