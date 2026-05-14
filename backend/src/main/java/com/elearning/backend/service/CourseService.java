package com.elearning.backend.service;

import com.elearning.backend.dto.*;
import com.elearning.backend.entity.Course;
import com.elearning.backend.entity.CourseMaterial;
import com.elearning.backend.entity.User;
import com.elearning.backend.exception.ForbiddenException;
import com.elearning.backend.exception.ResourceNotFoundException;
import com.elearning.backend.repository.CourseRepository;
import com.elearning.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    // -----------------------------------------------------------------------
    // GET all published courses (student view)
    // -----------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<CourseResponse> getPublishedCourses() {
        return courseRepository.findAllByPublishedTrue()
                .stream()
                .map(this::toCourseResponse)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // GET one course by id with materials (student view)
    // Only published courses visible to students — check enforced here
    // -----------------------------------------------------------------------
    @Transactional(readOnly = true)
    public CourseDetailResponse getCourseDetail(Long courseId) {
        Course course = courseRepository.findByIdWithMaterials(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        if (!course.getPublished()) {
            throw new ResourceNotFoundException("Course not found: " + courseId);
        }

        return toCourseDetailResponse(course);
    }

    // -----------------------------------------------------------------------
    // GET instructor's own courses (instructor view — includes drafts)
    // -----------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<CourseResponse> getInstructorCourses(Long instructorId) {
        return courseRepository.findAllByInstructorId(instructorId)
                .stream()
                .map(this::toCourseResponse)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // GET one course with materials (for attend page — must be enrolled, checked in controller)
    // -----------------------------------------------------------------------
    @Transactional(readOnly = true)
    public CourseDetailResponse getCourseDetailForAttend(Long courseId) {
        Course course = courseRepository.findByIdWithMaterials(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));
        return toCourseDetailResponse(course);
    }

    // -----------------------------------------------------------------------
    // POST create course (instructor only — creates as unpublished draft)
    // -----------------------------------------------------------------------
    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request, Long instructorId) {
        User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setImageUrl(request.getImageUrl());
        course.setInstructor(instructor);
        course.setPublished(false); // always starts as draft

        Course saved = courseRepository.save(course);
        return toCourseResponse(saved);
    }

    // -----------------------------------------------------------------------
    // PATCH publish a course (instructor can only publish their own)
    // -----------------------------------------------------------------------
    @Transactional
    public CourseResponse publishCourse(Long courseId, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        if (!course.getInstructor().getId().equals(instructorId)) {
            throw new ForbiddenException("You can only publish your own courses");
        }

        course.setPublished(true);
        return toCourseResponse(courseRepository.save(course));
    }

    // -----------------------------------------------------------------------
    // Mapping helpers — entity → DTO (never expose entity directly)
    // -----------------------------------------------------------------------
    private CourseResponse toCourseResponse(Course course) {
        String instructorName = course.getInstructor() != null
                ? course.getInstructor().getFullName()
                : "Unknown";
        return new CourseResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getImageUrl(),
                instructorName,
                course.getPublished()
        );
    }

    private CourseDetailResponse toCourseDetailResponse(Course course) {
        String instructorName = course.getInstructor() != null
                ? course.getInstructor().getFullName()
                : "Unknown";

        List<MaterialResponse> materials = course.getMaterials().stream()
                .sorted((a, b) -> Integer.compare(a.getOrderIndex(), b.getOrderIndex()))
                .map(this::toMaterialResponse)
                .collect(Collectors.toList());

        return new CourseDetailResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getImageUrl(),
                instructorName,
                course.getPublished(),
                materials
        );
    }

    private MaterialResponse toMaterialResponse(CourseMaterial m) {
        return new MaterialResponse(
                m.getId(),
                m.getMaterialType().name(),
                m.getTitle(),
                m.getContent(),
                m.getContentUrl(),
                m.getOrderIndex()
        );
    }
}
