package com.elearning.backend.config;

import com.elearning.backend.entity.Admin;
import com.elearning.backend.entity.Instructor;
import com.elearning.backend.entity.Student;
import com.elearning.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DataInitializer runs once at application startup.
 *
 * WHY THIS EXISTS:
 * BCrypt hashes are non-deterministic — the same password produces a different
 * hash on every call because BCrypt generates a random salt each time.
 * A hash generated on one machine cannot be hard-coded in seed.sql and expected
 * to work on another machine's Spring Security PasswordEncoder.
 *
 * This class generates all seed hashes ON THE RUNNING MACHINE using the same
 * BCryptPasswordEncoder bean that AuthService uses for login verification.
 * This guarantees that passwordEncoder.matches(input, storedHash) always
 * returns true for the correct password, regardless of which machine runs the app.
 *
 * SEED ACCOUNTS CREATED (if they do not already exist):
 *   Admin      — admin@elearning.ub.cm     / Admin1234!     (approved = true)
 *   Instructor — instructor@elearning.ub.cm / Instructor1!   (approved = true, for demo)
 *   Student    — student@elearning.ub.cm    / Student1234!   (approved = true, auto by trigger)
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createAdmin();
        createDemoInstructor();
        createDemoStudent();
    }

    private void createAdmin() {
        String email = "admin@elearning.ub.cm";
        if (userRepository.existsByEmail(email)) {
            return; // already exists, skip
        }
        Admin admin = new Admin();
        admin.setFullName("System Administrator");
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode("Admin1234!"));
        admin.setApproved(true); // admin is pre-approved
        userRepository.save(admin);
        System.out.println("[DataInitializer] Admin account created: " + email + " / Admin1234!");
    }

    private void createDemoInstructor() {
        String email = "instructor@elearning.ub.cm";
        if (userRepository.existsByEmail(email)) {
            return;
        }
        Instructor instructor = new Instructor();
        instructor.setFullName("Demo Instructor");
        instructor.setEmail(email);
        instructor.setPasswordHash(passwordEncoder.encode("Instructor1!"));
        instructor.setApproved(true); // pre-approved for demo purposes
        userRepository.save(instructor);
        System.out.println("[DataInitializer] Instructor account created: " + email + " / Instructor1!");
    }

    private void createDemoStudent() {
        String email = "student@elearning.ub.cm";
        if (userRepository.existsByEmail(email)) {
            return;
        }
        Student student = new Student();
        student.setFullName("Demo Student");
        student.setEmail(email);
        student.setPasswordHash(passwordEncoder.encode("Student1234!"));
        // approved is set to true in Student constructor (and by DB trigger)
        userRepository.save(student);
        System.out.println("[DataInitializer] Student account created: " + email + " / Student1234!");
    }
}
