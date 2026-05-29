-- Create enum types
CREATE TYPE user_role AS ENUM ('STUDENT', 'INSTRUCTOR', 'ADMIN');

-- Create users table with single-table inheritance
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create trigger to auto-approve students
CREATE OR REPLACE FUNCTION auto_approve_student()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'STUDENT' THEN
        NEW.approved := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_approve_student
    BEFORE INSERT ON users FOR EACH ROW
    EXECUTE FUNCTION auto_approve_student();

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
-- =============================================================
-- SPRINT 2 MIGRATION
-- Run this AFTER schema.sql (Sprint 1) on existing databases.
-- For fresh installs, this is already included in schema_full.sql
-- =============================================================

-- Enum for enrollment status
CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'DROPPED');

-- Enum for material type
CREATE TYPE material_type AS ENUM ('TEXT', 'VIDEO', 'FILE', 'LINK');

-- Courses table
CREATE TABLE courses (
    id            BIGSERIAL    PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    image_url     VARCHAR(500),
    instructor_id BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    published     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Course materials (composition — deleted when course is deleted)
CREATE TABLE course_materials (
    id            BIGSERIAL     PRIMARY KEY,
    course_id     BIGINT        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    material_type material_type NOT NULL DEFAULT 'TEXT',
    title         VARCHAR(255)  NOT NULL,
    content       TEXT,
    content_url   VARCHAR(500),
    order_index   INT           NOT NULL DEFAULT 0,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Enrollments (association class between Student and Course)
-- UNIQUE constraint enforces one enrollment per student per course
CREATE TABLE enrollments (
    id               BIGSERIAL         PRIMARY KEY,
    student_id       BIGINT            NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    course_id        BIGINT            NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status           enrollment_status NOT NULL DEFAULT 'ACTIVE',
    progress_percent FLOAT             NOT NULL DEFAULT 0.0,
    enrolled_at      TIMESTAMP         NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_id)
);

-- Indexes for common queries
CREATE INDEX idx_courses_instructor  ON courses(instructor_id);
CREATE INDEX idx_courses_published   ON courses(published);
CREATE INDEX idx_materials_course    ON course_materials(course_id);
CREATE INDEX idx_materials_order     ON course_materials(course_id, order_index);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course  ON enrollments(course_id);
