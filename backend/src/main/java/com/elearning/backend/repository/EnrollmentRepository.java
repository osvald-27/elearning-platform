package com.elearning.backend.repository;

import com.elearning.backend.entity.Enrollment;
import com.elearning.backend.entity.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    // Check if student is enrolled (any status) in a course
    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    // Get specific enrollment record
    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);

    // All active enrollments for a student (my courses)
    List<Enrollment> findAllByStudentIdAndStatus(Long studentId, EnrollmentStatus status);

    // All enrollments for a student (any status)
    List<Enrollment> findAllByStudentId(Long studentId);
}
