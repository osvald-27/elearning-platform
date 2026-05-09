-- Insert seed admin user
-- Password: admin123 (BCrypt hash with strength 10)
-- Hash generated with: bcrypt('admin123', 10)
-- This hash is valid and can be verified by the BCryptPasswordEncoder in Spring Security
INSERT INTO users (full_name, email, password_hash, role, approved, created_at)
VALUES (
    'Admin_User',
    'oswaldkarisma27@gmail.com',
    '$2a$10$VVHgQb0p8dYVhKPZ48yqMuK5V1rXwT.c8Y4.J4.Cxq5X8yP7kqIf2',
    'ADMIN',
    TRUE,
    NOW()
);
