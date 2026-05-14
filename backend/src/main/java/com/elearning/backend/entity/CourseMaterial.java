package com.elearning.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_materials")
public class CourseMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many materials belong to one course (composition)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(name = "material_type", nullable = false)
    private MaterialType materialType = MaterialType.TEXT;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "content_url", length = 500)
    private String contentUrl;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public CourseMaterial() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Course getCourse() { return course; }
    public MaterialType getMaterialType() { return materialType; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getContentUrl() { return contentUrl; }
    public Integer getOrderIndex() { return orderIndex; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setCourse(Course course) { this.course = course; }
    public void setMaterialType(MaterialType materialType) { this.materialType = materialType; }
    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
    public void setContentUrl(String contentUrl) { this.contentUrl = contentUrl; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
}
