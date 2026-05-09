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
