package com.elearning.backend.dto;

public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private String instructorName;
    private Boolean published;

    public CourseResponse(Long id, String title, String description,
                          String imageUrl, String instructorName, Boolean published) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.imageUrl = imageUrl;
        this.instructorName = instructorName;
        this.published = published;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public String getInstructorName() { return instructorName; }
    public Boolean getPublished() { return published; }
}
