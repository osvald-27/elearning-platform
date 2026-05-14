package com.elearning.backend.dto;

public class EnrollmentStatusResponse {
    private boolean enrolled;
    private String status; // null if not enrolled, "ACTIVE" or "DROPPED" if enrolled
    private Double progressPercent;

    public EnrollmentStatusResponse(boolean enrolled, String status, Double progressPercent) {
        this.enrolled = enrolled;
        this.status = status;
        this.progressPercent = progressPercent;
    }

    public boolean isEnrolled() { return enrolled; }
    public String getStatus() { return status; }
    public Double getProgressPercent() { return progressPercent; }
}
