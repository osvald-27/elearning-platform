-- =============================================================
-- SPRINT 2 SEED DATA
-- Run AFTER migration_sprint2.sql
-- Requires seed.sql (Sprint 1) to have been run first so
-- the admin user (id=1) and instructor exist.
-- =============================================================

-- Insert a seed instructor (password: instructor123)
INSERT INTO users (full_name, email, password_hash, role, approved, created_at)
VALUES (
    'Dr. Grace Nkemdirim',
    'instructor@elearning.ub.cm',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lBqy',
    'INSTRUCTOR',
    TRUE,
    NOW()
);

-- Insert a seed student (password: student123)
INSERT INTO users (full_name, email, password_hash, role, approved, created_at)
VALUES (
    'Dave Alan',
    'student@elearning.ub.cm',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lBqy',
    'STUDENT',
    TRUE,
    NOW()
);

-- 3 published courses + 1 unpublished draft
-- instructor_id references the instructor inserted above (adjust id if needed)
INSERT INTO courses (title, description, image_url, instructor_id, published) VALUES
(
    'Introduction to Java Programming',
    'Learn Java from the ground up. Covers variables, control flow, OOP, and collections. No prior experience needed.',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
    2,
    TRUE
),
(
    'Web Development with React',
    'Build modern web applications using React 19, TypeScript, and REST APIs. Includes hands-on projects.',
    'https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?w=400',
    2,
    TRUE
),
(
    'Database Design and SQL',
    'Master relational database design, normalization, and SQL from basic queries to complex joins and transactions.',
    'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400',
    2,
    TRUE
),
(
    'Advanced Algorithms (DRAFT)',
    'This course is still being prepared. Not visible to students.',
    NULL,
    2,
    FALSE
);

-- Materials for Course 1: Introduction to Java
INSERT INTO course_materials (course_id, material_type, title, content, content_url, order_index) VALUES
(1, 'TEXT',  'What is Java?',           'Java is a high-level, class-based, object-oriented programming language designed to have as few implementation dependencies as possible. It was created by James Gosling at Sun Microsystems in 1995.', NULL, 1),
(1, 'VIDEO', 'Installing the JDK',      NULL, 'https://www.youtube.com/watch?v=example1', 2),
(1, 'TEXT',  'Your First Java Program', 'Every Java program starts with a class. Inside the class is the main method — the entry point the JVM calls when your program starts. System.out.println() prints text to the terminal.', NULL, 3),
(1, 'TEXT',  'Variables and Types',     'Java is statically typed. Every variable must have a declared type: int, double, boolean, String, or any class. The compiler checks types at compile time, catching errors before the program runs.', NULL, 4),
(1, 'FILE',  'Java Cheat Sheet',        NULL, 'https://example.com/java-cheatsheet.pdf', 5);

-- Materials for Course 2: Web Development with React
INSERT INTO course_materials (course_id, material_type, title, content, content_url, order_index) VALUES
(2, 'TEXT',  'What is React?',          'React is a JavaScript library for building user interfaces. It was created by Facebook in 2013. React uses a component-based architecture where UIs are built from small, reusable pieces.', NULL, 1),
(2, 'VIDEO', 'Setting Up Your Environment', NULL, 'https://www.youtube.com/watch?v=example2', 2),
(2, 'TEXT',  'Components and JSX',      'JSX is a syntax extension for JavaScript that lets you write HTML-like markup inside a JavaScript file. React transforms JSX into regular JavaScript function calls at build time.', NULL, 3),
(2, 'TEXT',  'State and Props',         'Props are data passed from parent to child components. State is data that a component manages internally. When state changes, React re-renders the component automatically.', NULL, 4);

-- Materials for Course 3: Database Design
INSERT INTO course_materials (course_id, material_type, title, content, content_url, order_index) VALUES
(3, 'TEXT',  'What is a Relational Database?', 'A relational database organises data into tables with rows and columns. Tables are related to each other through foreign keys. SQL (Structured Query Language) is used to query and manipulate the data.', NULL, 1),
(3, 'TEXT',  'Normalization',           'Normalization is the process of organizing a database to reduce redundancy. The three main normal forms are 1NF (atomic values), 2NF (no partial dependencies), and 3NF (no transitive dependencies).', NULL, 2),
(3, 'VIDEO', 'Writing Your First Query', NULL, 'https://www.youtube.com/watch?v=example3', 3);
