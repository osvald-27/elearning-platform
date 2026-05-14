package com.elearning.backend.controller;

import com.elearning.backend.dto.*;
import com.elearning.backend.exception.ForbiddenException;
import com.elearning.backend.service.CourseService;
import com.elearning.backend.service.EnrollmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private EnrollmentService enrollmentService;

    // GET /api/courses — all published courses (STUDENT only)
    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<CourseResponse>> getPublishedCourses() {
        return ResponseEntity.ok(courseService.getPublishedCourses());
    }

    // GET /api/courses/{id} — course detail + materials (STUDENT only)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<CourseDetailResponse> getCourseDetail(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseDetail(id));
    }

    // GET /api/courses/{id}/attend — materials for enrolled student only
    @GetMapping("/{id}/attend")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<CourseDetailResponse> attendCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {

        if (!enrollmentService.isActivelyEnrolled(id, userId)) {
            throw new ForbiddenException("You must be enrolled to attend this course");
        }
        return ResponseEntity.ok(courseService.getCourseDetailForAttend(id));
    }

    // GET /api/courses/instructor/my-courses — instructor's own courses
    @GetMapping("/instructor/my-courses")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<List<CourseResponse>> getInstructorCourses(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(courseService.getInstructorCourses(userId));
    }

    // POST /api/courses — create new course (INSTRUCTOR only, starts as draft)
    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CreateCourseRequest request,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseService.createCourse(request, userId));
    }

    // PATCH /api/courses/{id}/publish — publish a draft (INSTRUCTOR only)
    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<CourseResponse> publishCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(courseService.publishCourse(id, userId));
    }
}
