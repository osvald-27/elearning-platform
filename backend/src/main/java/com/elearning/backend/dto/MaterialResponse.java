package com.elearning.backend.dto;

public class MaterialResponse {
    private Long id;
    private String materialType;
    private String title;
    private String content;
    private String contentUrl;
    private Integer orderIndex;

    public MaterialResponse(Long id, String materialType, String title,
                            String content, String contentUrl, Integer orderIndex) {
        this.id = id;
        this.materialType = materialType;
        this.title = title;
        this.content = content;
        this.contentUrl = contentUrl;
        this.orderIndex = orderIndex;
    }

    public Long getId() { return id; }
    public String getMaterialType() { return materialType; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getContentUrl() { return contentUrl; }
    public Integer getOrderIndex() { return orderIndex; }
}
