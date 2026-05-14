package com.elearning.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Association class between Student and Course.
 * Carries its own properties: status, progress, enrolled_at.
 * This is the OOP "association class" pattern — a many-to-many
 * relationship that has data of its own.
 */
@Entity
@Table(name = "enrollments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "course_id"}))
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    @Column(name = "progress_percent", nullable = false)
    private Double progressPercent = 0.0;

    @Column(name = "enrolled_at", nullable = false)
    private LocalDateTime enrolledAt;

    public Enrollment() {
        this.enrolledAt = LocalDateTime.now();
        this.status = EnrollmentStatus.ACTIVE;
        this.progressPercent = 0.0;
    }

    // Getters
    public Long getId() { return id; }
    public User getStudent() { return student; }
    public Course getCourse() { return course; }
    public EnrollmentStatus getStatus() { return status; }
    public Double getProgressPercent() { return progressPercent; }
    public LocalDateTime getEnrolledAt() { return enrolledAt; }

    // Setters
    public void setStudent(User student) { this.student = student; }
    public void setCourse(Course course) { this.course = course; }
    public void setStatus(EnrollmentStatus status) { this.status = status; }
    public void setProgressPercent(Double progressPercent) { this.progressPercent = progressPercent; }
}
