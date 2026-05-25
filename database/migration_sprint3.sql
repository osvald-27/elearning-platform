-- =============================================================
-- SPRINT 3 MIGRATION
-- Run AFTER migration_sprint2.sql
-- =============================================================

CREATE TABLE quizzes (
    id                 BIGSERIAL    PRIMARY KEY,
    course_id          BIGINT       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title              VARCHAR(255) NOT NULL,
    time_limit_minutes INT          NOT NULL DEFAULT 30,
    passing_score      FLOAT        NOT NULL DEFAULT 50.0,
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE questions (
    id                   BIGSERIAL PRIMARY KEY,
    quiz_id              BIGINT    NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text        TEXT      NOT NULL,
    options              JSONB     NOT NULL,
    correct_option_index INT       NOT NULL,
    points               INT       NOT NULL DEFAULT 1
);

CREATE TABLE quiz_results (
    id           BIGSERIAL PRIMARY KEY,
    student_id   BIGINT    NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    quiz_id      BIGINT    NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score        FLOAT     NOT NULL,
    passed       BOOLEAN   NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, quiz_id)
);

CREATE TABLE certificates (
    id               BIGSERIAL    PRIMARY KEY,
    student_id       BIGINT       NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    course_id        BIGINT       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    certificate_code VARCHAR(100) NOT NULL UNIQUE,
    issued_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_id)
);

CREATE TABLE feedback (
    id           BIGSERIAL PRIMARY KEY,
    submitted_by BIGINT    REFERENCES users(id) ON DELETE SET NULL,
    content      TEXT      NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_course    ON quizzes(course_id);
CREATE INDEX idx_questions_quiz    ON questions(quiz_id);
CREATE INDEX idx_results_student   ON quiz_results(student_id);
CREATE INDEX idx_certs_student     ON certificates(student_id);
CREATE INDEX idx_feedback_status   ON feedback(status);
