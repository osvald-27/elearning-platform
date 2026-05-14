package com.elearning.backend.service;

import com.elearning.backend.dto.EnrollmentResponse;
import com.elearning.backend.dto.EnrollmentStatusResponse;
import com.elearning.backend.dto.MessageResponse;
import com.elearning.backend.entity.*;
import com.elearning.backend.exception.AlreadyEnrolledException;
import com.elearning.backend.exception.NotEnrolledException;
import com.elearning.backend.exception.ResourceNotFoundException;
import com.elearning.backend.repository.CourseRepository;
import com.elearning.backend.repository.EnrollmentRepository;
import com.elearning.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EnrollmentService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    // -----------------------------------------------------------------------
    // POST enroll a student in a course
    // Rules: course must exist + be published, student not already enrolled
    // -----------------------------------------------------------------------
    @Transactional
    public MessageResponse enroll(Long courseId, Long studentId) {
        // Course must exist and be published
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        if (!course.getPublished()) {
            throw new ResourceNotFoundException("Course not found: " + courseId);
        }

        // Check for existing enrollment (any status)
        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new AlreadyEnrolledException("You are already enrolled in this course");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        // status = ACTIVE and progressPercent = 0.0 set by constructor

        enrollmentRepository.save(enrollment);

        return new MessageResponse("Successfully enrolled in " + course.getTitle());
    }

    // -----------------------------------------------------------------------
    // PATCH drop a course — changes status to DROPPED, does NOT delete
    // -----------------------------------------------------------------------
    @Transactional
    public MessageResponse drop(Long courseId, Long studentId) {
        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new NotEnrolledException("You are not enrolled in this course"));

        if (enrollment.getStatus() == EnrollmentStatus.DROPPED) {
            throw new NotEnrolledException("You have already dropped this course");
        }

        enrollment.setStatus(EnrollmentStatus.DROPPED);
        enrollmentRepository.save(enrollment);

        return new MessageResponse("Successfully dropped " + enrollment.getCourse().getTitle());
    }

    // -----------------------------------------------------------------------
    // GET all active enrollments for a student (my courses)
    // -----------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getMyCourses(Long studentId) {
        return enrollmentRepository
                .findAllByStudentIdAndStatus(studentId, EnrollmentStatus.ACTIVE)
                .stream()
                .map(this::toEnrollmentResponse)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // GET enrollment status for one course (used by course detail page)
    // -----------------------------------------------------------------------
    @Transactional(readOnly = true)
    public EnrollmentStatusResponse getEnrollmentStatus(Long courseId, Long studentId) {
        Optional<Enrollment> enrollment = enrollmentRepository
                .findByStudentIdAndCourseId(studentId, courseId);

        if (enrollment.isEmpty()) {
            return new EnrollmentStatusResponse(false, null, null);
        }

        Enrollment e = enrollment.get();
        return new EnrollmentStatusResponse(
                true,
                e.getStatus().name(),
                e.getProgressPercent()
        );
    }

    // -----------------------------------------------------------------------
    // Check if student is actively enrolled — used by CourseController
    // to gate the attend endpoint
    // -----------------------------------------------------------------------
    @Transactional(readOnly = true)
    public boolean isActivelyEnrolled(Long courseId, Long studentId) {
        return enrollmentRepository
                .findByStudentIdAndCourseId(studentId, courseId)
                .map(e -> e.getStatus() == EnrollmentStatus.ACTIVE)
                .orElse(false);
    }

    // -----------------------------------------------------------------------
    // Mapping helper
    // -----------------------------------------------------------------------
    private EnrollmentResponse toEnrollmentResponse(Enrollment e) {
        String instructorName = e.getCourse().getInstructor() != null
                ? e.getCourse().getInstructor().getFullName()
                : "Unknown";
        return new EnrollmentResponse(
                e.getId(),
                e.getCourse().getId(),
                e.getCourse().getTitle(),
                e.getCourse().getImageUrl(),
                instructorName,
                e.getStatus().name(),
                e.getProgressPercent()
        );
    }
}
