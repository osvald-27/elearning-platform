package com.elearning.backend.repository;

import com.elearning.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    // Students see only published courses
    List<Course> findAllByPublishedTrue();

    // Instructor sees their own courses (published + drafts)
    List<Course> findAllByInstructorId(Long instructorId);

    // Load course with materials in one query to avoid N+1
    @Query("SELECT c FROM Course c LEFT JOIN FETCH c.materials m WHERE c.id = :id ORDER BY m.orderIndex ASC")
    Optional<Course> findByIdWithMaterials(@Param("id") Long id);

    // Count enrollments per course for instructor dashboard
    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId AND e.status = 'ACTIVE'")
    Long countActiveEnrollments(@Param("courseId") Long courseId);
}
