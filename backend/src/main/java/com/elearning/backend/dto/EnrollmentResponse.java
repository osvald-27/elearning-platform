package com.elearning.backend.dto;

public class EnrollmentResponse {
    private Long enrollmentId;
    private Long courseId;
    private String courseTitle;
    private String courseImageUrl;
    private String instructorName;
    private String status;
    private Double progressPercent;

    public EnrollmentResponse(Long enrollmentId, Long courseId, String courseTitle,
                              String courseImageUrl, String instructorName,
                              String status, Double progressPercent) {
        this.enrollmentId = enrollmentId;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.courseImageUrl = courseImageUrl;
        this.instructorName = instructorName;
        this.status = status;
        this.progressPercent = progressPercent;
    }

    public Long getEnrollmentId() { return enrollmentId; }
    public Long getCourseId() { return courseId; }
    public String getCourseTitle() { return courseTitle; }
    public String getCourseImageUrl() { return courseImageUrl; }
    public String getInstructorName() { return instructorName; }
    public String getStatus() { return status; }
    public Double getProgressPercent() { return progressPercent; }
}
