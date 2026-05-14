package com.elearning.backend.dto;

import java.util.List;

public class CourseDetailResponse {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private String instructorName;
    private Boolean published;
    private List<MaterialResponse> materials;

    public CourseDetailResponse(Long id, String title, String description,
                                String imageUrl, String instructorName,
                                Boolean published, List<MaterialResponse> materials) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.imageUrl = imageUrl;
        this.instructorName = instructorName;
        this.published = published;
        this.materials = materials;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public String getInstructorName() { return instructorName; }
    public Boolean getPublished() { return published; }
    public List<MaterialResponse> getMaterials() { return materials; }
}
