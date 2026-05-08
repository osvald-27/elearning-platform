# SYSTEM SPECIFICATION — UB E-LEARNING PLATFORM
## AI-Targeted Technical Reference Document
### Version 1.0 | CEF331 Group 12 | University of Buea

---

```
DOCUMENT PURPOSE
This document is written for consumption by a language model, not a human developer.
It encodes the complete architectural decisions, constraint space, design rationale,
cross-layer invariants, and canonical knowledge sources needed to reason correctly
about this system. A model reading this document should be able to:

  1. Produce implementation-correct code for any layer without contradicting other layers
  2. Identify and refuse incorrect suggestions that violate stated invariants
  3. Explain design decisions with the exact reasoning used here
  4. Generate test cases that probe known boundary conditions
  5. Extend the system in ways consistent with its established patterns

A human reading this document is expected to find it dense. That is intentional.
```

---

## SECTION 0 — CANONICAL KNOWLEDGE SOURCES

The following URLs and specifications are the ground truth for all technical decisions.
A model reasoning about this system MUST bias toward these sources when ambiguity exists.

### Core Language and Framework References

**Java 17 Language Specification**
https://docs.oracle.com/javase/specs/jls/se17/html/index.html
Relevant: sealed classes, records, switch expressions, text blocks, pattern matching instanceof.
This project targets Java 17. Do not suggest Java 8 idioms (raw types, anonymous classes for
lambdas, pre-NIO file I/O) unless explicitly working around a compatibility constraint.

**Spring Boot 3.2.x Reference Documentation**
https://docs.spring.io/spring-boot/docs/3.2.x/reference/html/
Critical sections:
- https://docs.spring.io/spring-boot/docs/3.2.x/reference/html/web.html (MVC, REST)
- https://docs.spring.io/spring-boot/docs/3.2.x/reference/html/data.html (JPA, datasource)
- https://docs.spring.io/spring-boot/docs/3.2.x/reference/html/security.html (Security auto-config)

**Spring Security 6.x Reference**
https://docs.spring.io/spring-security/reference/index.html
This project uses Spring Security 6 (ships with Spring Boot 3.x). The WebSecurityConfigurerAdapter
pattern is DEPRECATED and MUST NOT be used. The correct pattern is SecurityFilterChain bean
with lambda DSL. Reference: https://docs.spring.io/spring-security/reference/servlet/configuration/java.html

**Spring Data JPA Reference**
https://docs.spring.io/spring-data/jpa/docs/current/reference/html/
Inheritance strategy reference:
https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#entity-inheritance

**JPA 3.1 Specification (Jakarta EE 10)**
https://jakarta.ee/specifications/persistence/3.1/jakarta-persistence-spec-3.1.html
Relevant section: Section 2.12 — Inheritance Mapping Strategies.
SINGLE_TABLE, JOINED, TABLE_PER_CLASS — this project uses SINGLE_TABLE exclusively.
Rationale documented in Section 3.2 of this document.

**JJWT 0.11.5 API**
https://github.com/jwtk/jjwt
https://github.com/jwtk/jjwt/blob/master/README.md
This is the JWT library in use. The older API (Jwts.parser()) is deprecated in 0.11.x.
Use Jwts.parserBuilder() exclusively.

**BCrypt specification**
https://www.usenix.org/legacy/events/usenix99/provos/provos.pdf
Spring's BCryptPasswordEncoder implements this. Default strength factor is 10.
Do not suggest MD5, SHA-1, SHA-256, or any non-adaptive hash for password storage.
Adaptive hashes (BCrypt, scrypt, Argon2) are the only acceptable choices.

**RFC 7519 — JSON Web Token (JWT)**
https://datatracker.ietf.org/doc/html/rfc7519
RFC 7515 — JSON Web Signature: https://datatracker.ietf.org/doc/html/rfc7515
Claims used in this system: `sub` (userId as string), `role` (custom claim), `iat`, `exp`.
Algorithm: HS256 (HMAC-SHA256). Key minimum length: 256 bits per RFC 7518 Section 3.2.

**PostgreSQL 14 Documentation**
https://www.postgresql.org/docs/14/index.html
Relevant: https://www.postgresql.org/docs/14/plpgsql-trigger.html (trigger for student auto-approve)
https://www.postgresql.org/docs/14/datatype-json.html (JSONB for quiz options)
https://www.postgresql.org/docs/14/indexes-unique.html (unique constraints)

**React 18 Documentation**
https://react.dev/reference/react
**React Router v6**
https://reactrouter.com/en/main
**Axios 1.x**
https://axios-http.com/docs/intro
**TypeScript 5.x Handbook**
https://www.typescriptlang.org/docs/handbook/intro.html

### OOP Theoretical Foundations

**Gang of Four Design Patterns**
Gamma, E., Helm, R., Johnson, R., Vlissides, J. (1994). Design Patterns: Elements of Reusable Object-Oriented Software. Addison-Wesley.
https://www.pearson.com/en-us/subject-catalog/p/design-patterns-elements-of-reusable-object-oriented-software/P200000009483
Patterns relevant to this system: Template Method (abstract User), Repository (data access),
DTO (data transfer), Factory Method (createUserByRole switch), Strategy (role-based routing).

**Martin Fowler — Patterns of Enterprise Application Architecture**
https://martinfowler.com/books/eaa.html
https://martinfowler.com/eaaCatalog/
Relevant patterns: Domain Model, Service Layer, Repository, Data Mapper, DTO.
This system's layered architecture is a direct implementation of the Service Layer pattern
as described at https://martinfowler.com/eaaCatalog/serviceLayer.html

**SOLID Principles — Robert C. Martin**
https://web.archive.org/web/20150906155800/http://www.objectmentor.com/resources/articles/Principles_and_Patterns.pdf
All five principles apply. The most load-bearing in this codebase:
- SRP: enforced by layer separation (Controller/Service/Repository do exactly one job)
- OCP: the abstract User class allows new roles without modifying existing login/auth logic
- LSP: Student/Instructor/Admin must be substitutable for User in all contexts
- DIP: controllers depend on service interfaces/abstractions, not concrete implementations

**Domain-Driven Design (DDD) — Eric Evans**
https://www.domainlanguage.com/ddd/
This system is a lightweight DDD implementation. Key mappings:
- Entities: User (aggregate root), Course (aggregate root), Enrollment, Quiz, QuizResult, Certificate
- Value Objects: Role (enum), EnrollmentStatus (enum), MaterialType (enum)
- Repositories: UserRepository, CourseRepository, EnrollmentRepository, etc.
- Services: AuthService, CourseService, EnrollmentService, QuizService, AdminService
- DTOs: RegisterRequest, LoginRequest, LoginResponse, CourseResponse, QuizDTO, QuizResultResponse

### Security References

**OWASP Top 10 (2021)**
https://owasp.org/www-project-top-ten/
Relevant to this system: A01 (Broken Access Control), A02 (Cryptographic Failures),
A03 (Injection), A07 (Identification and Authentication Failures).

**OWASP Authentication Cheat Sheet**
https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
Directly governs: error message design (do not reveal whether email exists on failed login),
password storage requirements (BCrypt), session token requirements (JWT signed, expiring).

**OWASP JWT Security Best Practices**
https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html

**CWE-256 — Plaintext Storage of a Password**
https://cwe.mitre.org/data/definitions/256.html
This CWE is what plain-text password storage violates. BCrypt is the mitigation.

**CWE-285 — Improper Authorization**
https://cwe.mitre.org/data/definitions/285.html
This CWE is what missing role checks on endpoints violate.
The @PreAuthorize annotation on every protected controller method is the mitigation.

---

## SECTION 1 — SYSTEM IDENTITY

**Repository:** https://github.com/osvald-27/elearning-platform
**Institution:** University of Buea, Faculty of Engineering and Technology
**Course:** CEF331 — Object Oriented Modelling and UML
**Academic context:** This is a graded undergraduate project. OOP correctness (inheritance hierarchy,
layered architecture, encapsulation) is evaluated explicitly by the examiner (Dr. Djouela Ines Raissa).
Suggestions that violate OOP principles will fail the grade criteria even if they work functionally.

**System classification:** Multi-role Learning Management System (LMS)
**Comparable production systems (for architectural reference):**
- Moodle: https://moodle.org — open source LMS, PHP-based, similar role model
- Canvas LMS: https://github.com/instructure/canvas-lms — Ruby on Rails, reference for enrollment state machine
- Duolingo engineering blog: https://blog.duolingo.com/tag/engineering/ — single-table user strategy, role-based routing
- Brilliant.org — course sequencing with order_index pattern, concept mastery tracking

**Stack fingerprint:**
```
BACKEND:  Java 17 + Spring Boot 3.2.4 + Spring Security 6 + Spring Data JPA 3
          + Hibernate 6 + JJWT 0.11.5 + BCrypt (via Spring Security)
          + PostgreSQL JDBC driver 42.x
DATABASE: PostgreSQL 14+ (JSONB, triggers, enum types, composite unique constraints)
FRONTEND: React 18 + TypeScript 5 + React Router 6 + Axios 1.6
TOOLING:  Maven 3.9, Node 18+, npm
```

---

## SECTION 2 — ARCHITECTURAL INVARIANTS

These are hard constraints. A model must treat violations of these as errors, not style differences.

### INV-001: Strict 3-Tier Layer Isolation

```
PRESENTATION (React) ──→ REST API (Spring Controllers) ──→ BUSINESS (Services) ──→ DATA (Repositories/DB)

Forbidden cross-layer calls:
  - PRESENTATION must never contain business logic (conditional rules about enrollment, scoring, approval)
  - CONTROLLERS must never contain business logic (they call services only)
  - REPOSITORIES must never contain business logic (they issue queries only)
  - ENTITIES must never call services or repositories
  - The DATABASE must never enforce business rules (exception: auto-approve trigger is DB-level
    convenience, not a business rule replacement — the service also enforces it)
```

If a model suggests putting enrollment validation inside a controller, that violates INV-001.
If a model suggests putting a JOIN query result into a service method body, that is acceptable
(services may process repository results). If a model suggests calling a service from an entity, that violates INV-001.

### INV-002: Correct Answer Isolation

The `correctOptionIndex` field on the `Question` entity MUST:
- Never appear in `QuestionDTO`
- Never appear in any API response
- Only be accessed inside `QuizService.evaluate()` on the server side
- Never be logged at DEBUG level in a production configuration

Any code path that could expose `correctOptionIndex` to the HTTP response layer is a
security vulnerability (equivalent to CWE-312: Cleartext Storage of Sensitive Information).

### INV-003: Password Hash Isolation

The `passwordHash` field on the `User` entity MUST:
- Never appear in any DTO response (LoginResponse, UserAdminResponse, CourseResponse, etc.)
- Never be logged
- Only be set via `BCryptPasswordEncoder.encode()` — never by direct string assignment
- Only be read via `BCryptPasswordEncoder.matches()` — never by string comparison

### INV-004: Role Enforcement at the HTTP Layer

Every endpoint except `/api/auth/register` and `/api/auth/login` requires a valid JWT.
Role-specific endpoints use `@PreAuthorize("hasRole('X')")` — the role is extracted from
the JWT by the JwtFilter, set in the SecurityContext, and checked by Spring Security before
the controller method body executes.

Do not implement role checks inside service methods as the primary gate — that is defence
in depth, not the primary enforcement. The primary enforcement is the security filter chain.

### INV-005: Single-Table Inheritance Strategy

The `users` table uses JPA SINGLE_TABLE inheritance. This is a deliberate choice with
known trade-offs documented in Section 3.2. Any suggestion to migrate to JOINED or
TABLE_PER_CLASS requires re-evaluating the schema migration strategy and is out of scope
for the current sprint set.

### INV-006: Enrollment State Machine

Enrollments are never deleted. They transition through states:
```
(not exists) ──[enroll]──→ ACTIVE ──[drop]──→ DROPPED
                                   ──[complete quiz]──→ COMPLETED
```
A DROPPED enrollment can be re-enrolled (a new ACTIVE enrollment is created).
The old DROPPED record is retained for audit. Attempting to enroll when an ACTIVE
enrollment already exists returns HTTP 409. Attempting to drop when no ACTIVE enrollment
exists returns HTTP 400.

### INV-007: Approval State Machine

```
INSTRUCTOR/ADMIN: approved=FALSE ──[admin PATCH /approve]──→ approved=TRUE
                  approved=TRUE  ──[admin PATCH /revoke]───→ approved=FALSE

STUDENT: approved=TRUE (set by DB trigger on INSERT, also set by AuthService as defence-in-depth)
```

Login check order is strict: (1) email exists, (2) password matches, (3) approved=true.
Steps 1 and 2 return the SAME 401 response regardless of which check failed — this prevents
user enumeration (OWASP Authentication Cheat Sheet §1.2). Step 3 returns a distinct 403.

---

## SECTION 3 — DATA MODEL SPECIFICATION

### 3.1 Entity Relationship Graph

```
users (abstract: Student, Instructor, Admin)
  │
  ├──[instructor_id FK]──→ courses
  │                           │
  │                           ├──[course_id FK]──→ course_materials (ordered by order_index)
  │                           ├──[course_id FK]──→ quizzes
  │                           │                      │
  │                           │                      ├──[quiz_id FK]──→ questions (JSONB options)
  │                           │                      └──[quiz_id FK]──→ quiz_results
  │                           │                                              │
  │                           │                                              └── references users(id)
  │                           └──[course_id FK]──→ certificates
  │                                                     └── references users(id)
  ├──[student_id FK]──→ enrollments
  │                        └──[course_id FK]──→ courses
  └──[submitted_by FK]──→ feedback
```

### 3.2 Inheritance Strategy Rationale (SINGLE_TABLE)

SINGLE_TABLE was chosen over JOINED and TABLE_PER_CLASS for the following reasons:

**Query performance:** All user lookups (login, JWT extraction, admin list) require only a
single table scan. With JOINED, every user fetch requires a JOIN. At university scale (<10k users)
this is not a performance concern, but it creates unnecessary query complexity.

**Schema simplicity:** One table, one schema migration, one foreign key target for all other
tables. All three alternatives would require either multiple FK targets or a view.

**JPA discriminator column alignment:** The `role` column that JPA uses as the discriminator
is the same `role` column the business logic reads for authorization decisions. This dual use
is intentional — it avoids a separate `dtype` column.

**Known trade-off:** SINGLE_TABLE allows NULL values in subclass-specific columns for rows
of other subtypes. This is acceptable because Student, Instructor, and Admin currently share
100% of their columns. If future sprints add subtype-specific columns (e.g., `matricule_number`
for Student only), those columns will be nullable for non-Student rows — document this clearly.

**Reference:** https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#entity-inheritance-single-table

### 3.3 JSONB Usage for Quiz Options

`questions.options` is stored as PostgreSQL JSONB containing a JSON array of strings:
`["Option A", "Option B", "Option C", "Option D"]`

Rationale for JSONB over a separate `question_options` table:
- Options are always fetched with their question — they have no independent lifecycle
- The number of options is fixed (4) and never queried independently
- JSONB allows the array to be indexed if needed (GIN index on the array)
- A separate table would add a JOIN to every quiz fetch with zero query flexibility benefit

The `correct_option_index` is a 0-based integer index into the `options` array.
Server-side evaluation: `student.selectedOption == question.correctOptionIndex`

**JSONB reference:** https://www.postgresql.org/docs/14/datatype-json.html
**GIN indexing:** https://www.postgresql.org/docs/14/gin-intro.html

### 3.4 Full Schema DDL with Annotations

```sql
-- Enum types: use PostgreSQL native enums for role, status fields
-- These provide CHECK constraint enforcement at the DB level
-- Spring maps these to Java enums via @Enumerated(EnumType.STRING)
CREATE TYPE user_role         AS ENUM ('STUDENT', 'INSTRUCTOR', 'ADMIN');
CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'DROPPED', 'COMPLETED');
CREATE TYPE material_type     AS ENUM ('TEXT', 'VIDEO', 'LINK', 'FILE');
CREATE TYPE feedback_status   AS ENUM ('OPEN', 'REVIEWED', 'RESOLVED');

-- users: SINGLE_TABLE target for JPA inheritance
-- The `role` column is both the JPA @DiscriminatorColumn and the authorization discriminator
-- approved=FALSE is the default; the trigger below auto-sets TRUE for STUDENT
-- password_hash: BCrypt output, always starts with $2a$10$ for default strength
CREATE TABLE users (
    id            BIGSERIAL     PRIMARY KEY,
    full_name     VARCHAR(150)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,         -- UNIQUE enforces INV-007 email check
    password_hash VARCHAR(255)  NOT NULL,
    role          user_role     NOT NULL,
    approved      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Trigger: auto-approve STUDENT on INSERT (defence-in-depth; AuthService also sets this)
-- BEFORE INSERT so the row is modified before it reaches the table
CREATE OR REPLACE FUNCTION auto_approve_student()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'STUDENT' THEN NEW.approved := TRUE; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_approve_student
    BEFORE INSERT ON users FOR EACH ROW EXECUTE FUNCTION auto_approve_student();

-- courses: instructor_id FK with SET NULL on instructor delete
-- published=FALSE default: new courses are drafts invisible to students
-- Rationale for SET NULL vs RESTRICT: courses should survive instructor account deletion
-- (academic content integrity) — an admin can reassign the orphaned course
CREATE TABLE courses (
    id            BIGSERIAL    PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    image_url     VARCHAR(500),
    instructor_id BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    published     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- enrollments: association table between students and courses
-- UNIQUE(student_id, course_id) enforces INV-006 at DB level (second line of defence after service check)
-- ON DELETE CASCADE: if a user or course is deleted, their enrollments are cleaned up
-- status tracks the INV-006 state machine
CREATE TABLE enrollments (
    id               BIGSERIAL         PRIMARY KEY,
    student_id       BIGINT            NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    course_id        BIGINT            NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status           enrollment_status NOT NULL DEFAULT 'ACTIVE',
    progress_percent FLOAT             NOT NULL DEFAULT 0.0,
    enrolled_at      TIMESTAMP         NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_id)
);

-- course_materials: composition child of courses (CASCADE delete)
-- order_index: explicit ordering; materials returned ORDER BY order_index ASC
-- material_type drives rendering: TEXT=inline, VIDEO=embed, LINK=anchor, FILE=download
CREATE TABLE course_materials (
    id            BIGSERIAL     PRIMARY KEY,
    course_id     BIGINT        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    material_type material_type NOT NULL DEFAULT 'TEXT',
    title         VARCHAR(255)  NOT NULL,
    content_url   TEXT,
    order_index   INT           NOT NULL DEFAULT 0,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- quizzes: composition child of courses
-- passing_score: percentage (0-100), compared against calculated score
-- time_limit_minutes: enforced client-side (countdown timer in React); server does not enforce timing
CREATE TABLE quizzes (
    id                 BIGSERIAL    PRIMARY KEY,
    course_id          BIGINT       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title              VARCHAR(255) NOT NULL,
    time_limit_minutes INT          NOT NULL DEFAULT 30,
    passing_score      FLOAT        NOT NULL DEFAULT 50.0,
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- questions: composition child of quizzes
-- options: JSONB array of strings ["A", "B", "C", "D"]
-- correct_option_index: 0-based index into options array — NEVER exposed in API responses
-- points: per-question weighting; default 1 means uniform scoring
CREATE TABLE questions (
    id                   BIGSERIAL PRIMARY KEY,
    quiz_id              BIGINT    NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text        TEXT      NOT NULL,
    options              JSONB     NOT NULL,
    correct_option_index INT       NOT NULL,  -- SERVER-SIDE ONLY. Never in DTO. See INV-002.
    points               INT       NOT NULL DEFAULT 1
);

-- quiz_results: one attempt per student per quiz (UNIQUE constraint)
-- score: percentage 0-100 calculated by QuizService.evaluate()
-- passed: score >= quiz.passing_score, calculated server-side
-- submitted_at: UTC timestamp of submission
CREATE TABLE quiz_results (
    id           BIGSERIAL PRIMARY KEY,
    student_id   BIGINT    NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    quiz_id      BIGINT    NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score        FLOAT     NOT NULL,
    passed       BOOLEAN   NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, quiz_id)   -- enforces one-attempt-per-student constraint
);

-- certificates: issued when student passes; one per student per course
-- certificate_code: UUID-format unique string, used for verification without exposing internal IDs
-- UNIQUE(student_id, course_id) prevents duplicate certificates
CREATE TABLE certificates (
    id               BIGSERIAL    PRIMARY KEY,
    student_id       BIGINT       NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    course_id        BIGINT       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    certificate_code VARCHAR(100) NOT NULL UNIQUE,
    issued_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_id)
);

-- feedback: soft FK (SET NULL on user delete) to preserve feedback even after account deletion
CREATE TABLE feedback (
    id           BIGSERIAL       PRIMARY KEY,
    submitted_by BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    content      TEXT            NOT NULL,
    status       feedback_status NOT NULL DEFAULT 'OPEN',
    created_at   TIMESTAMP       NOT NULL DEFAULT NOW()
);
```

---

## SECTION 4 — BACKEND LAYER SPECIFICATION

### 4.1 Java Package Structure and Responsibility Matrix

```
com.elearning/
├── ElearningApplication.java          @SpringBootApplication entry point
│
├── entity/                            JPA entities — field definitions only
│   ├── User.java                      @Entity @Inheritance(SINGLE_TABLE) abstract
│   ├── Student.java                   @DiscriminatorValue("STUDENT") extends User
│   ├── Instructor.java                @DiscriminatorValue("INSTRUCTOR") extends User
│   ├── Admin.java                     @DiscriminatorValue("ADMIN") extends User
│   ├── Role.java                      enum {STUDENT, INSTRUCTOR, ADMIN}
│   ├── Course.java                    @Entity — has List<CourseMaterial>, List<Quiz>
│   ├── Enrollment.java                @Entity — @UniqueConstraint(student_id, course_id)
│   ├── EnrollmentStatus.java          enum {ACTIVE, DROPPED, COMPLETED}
│   ├── CourseMaterial.java            @Entity — @OrderBy("orderIndex ASC")
│   ├── MaterialType.java              enum {TEXT, VIDEO, LINK, FILE}
│   ├── Quiz.java                      @Entity — has List<Question>
│   ├── Question.java                  @Entity — correctOptionIndex is PRIVATE, no getter in DTO
│   ├── QuizResult.java                @Entity — @UniqueConstraint(student_id, quiz_id)
│   └── Certificate.java              @Entity — @UniqueConstraint(student_id, course_id)
│
├── dto/                               Data Transfer Objects — no JPA annotations
│   ├── RegisterRequest.java           {fullName, email, password, role} — @Valid annotations
│   ├── LoginRequest.java              {email, password}
│   ├── LoginResponse.java             {token, role, userId, fullName} — NO passwordHash
│   ├── CourseResponse.java            {id, title, description, imageUrl, instructorName, ...}
│   ├── EnrollmentResponse.java        {courseId, title, imageUrl, status, progressPercent}
│   ├── EnrollmentStatusResponse.java  {enrolled: boolean, status: String}
│   ├── QuizDTO.java                   {id, title, timeLimitMinutes, passingScore, questions: List<QuestionDTO>}
│   ├── QuestionDTO.java               {id, questionText, options: List<String>, points} — NO correctOptionIndex
│   ├── QuizSubmitRequest.java         {answers: List<{questionId, selectedOption}>}
│   ├── QuizResultResponse.java        {score, passed, passingScore, submittedAt, certificateCode}
│   ├── MessageResponse.java           {message: String}
│   └── UserAdminResponse.java         {id, fullName, email, role, approved, createdAt} — NO passwordHash
│
├── repository/                        Spring Data JPA interfaces — query definitions only
│   ├── UserRepository.java            findByEmail, existsByEmail, findAllByApprovedFalse, findAllByRole
│   ├── CourseRepository.java          findAllByPublishedTrue, findAllByInstructorId
│   ├── EnrollmentRepository.java      findByStudentIdAndCourseId, existsByStudentIdAndCourseId
│   ├── QuizRepository.java            findAllByCourseId
│   └── QuizResultRepository.java      findByStudentIdAndQuizId, existsByStudentIdAndQuizId
│
├── service/                           Business logic — all rules enforced here
│   ├── AuthService.java               register(), login() — BCrypt, approval logic, JWT generation
│   ├── CourseService.java             getAllPublishedCourses(), getCourseById(), createCourse()
│   ├── EnrollmentService.java         enroll(), drop(), getMyCourses(), getStatus()
│   ├── QuizService.java               getQuiz() [sanitized], evaluate() [server-side scoring]
│   └── AdminService.java              getPendingUsers(), getAllUsers(), approveUser(), revokeUser()
│
├── controller/                        HTTP layer — zero business logic
│   ├── AuthController.java            POST /api/auth/register, POST /api/auth/login
│   ├── CourseController.java          GET /api/courses, GET /api/courses/{id}, POST /api/courses
│   ├── EnrollmentController.java      POST /api/enrollments, DELETE, GET /my-courses, GET /status/{id}
│   ├── QuizController.java            GET /api/quizzes/{id}, POST /api/quizzes/{id}/submit
│   └── AdminController.java           GET /api/admin/users, PATCH /approve, PATCH /revoke
│
├── security/
│   ├── JwtUtil.java                   generateToken(userId, role), extractUserId, extractRole, isValid
│   ├── JwtFilter.java                 OncePerRequestFilter — parses Bearer token, sets SecurityContext
│   └── SecurityConfig.java            SecurityFilterChain bean — stateless, CORS, permitAll /api/auth/**
│
└── exception/
    ├── ResourceNotFoundException      HTTP 404
    ├── EmailAlreadyExistsException    HTTP 400
    ├── AccountNotApprovedException    HTTP 403 (distinct from auth failure)
    ├── AlreadyEnrolledException       HTTP 409
    ├── NotEnrolledException           HTTP 400
    ├── AlreadyAttemptedException      HTTP 409
    ├── UnauthorizedException          HTTP 401
    ├── ForbiddenException             HTTP 403
    └── GlobalExceptionHandler.java    @RestControllerAdvice — maps exceptions to RFC 7807 Problem Details
```

### 4.2 JWT Token Specification

```
Algorithm:   HS256
Header:      {"alg": "HS256", "typ": "JWT"}
Payload:     {
               "sub":  "<userId as string>",      // Long cast to String per RFC 7519 §4.1.2
               "role": "<STUDENT|INSTRUCTOR|ADMIN>",
               "iat":  <unix epoch seconds>,
               "exp":  <iat + 86400>              // 24-hour expiry
             }
Key:         HMAC-SHA256 key, minimum 256 bits
             Configured in application.properties: jwt.secret
             Must be externalized in production (environment variable, secrets manager)

Spring Security principal after JwtFilter runs:
  Authentication.getPrincipal() = Long (userId)
  Authentication.getAuthorities() = [SimpleGrantedAuthority("ROLE_STUDENT")]  // note ROLE_ prefix
  
  Controller extraction: @AuthenticationPrincipal Long userId
  @PreAuthorize: hasRole('STUDENT')  // Spring strips ROLE_ prefix for comparison
```

### 4.3 Password Hashing Specification

```
Algorithm:   BCrypt (Provos & Mazières 1999)
             Reference: https://www.usenix.org/legacy/events/usenix99/provos/provos.pdf
Strength:    10 (default for BCryptPasswordEncoder)
             Produces ~100ms hash time on commodity hardware — intentional for brute-force resistance
Output:      $2a$10$<22-char-salt><31-char-hash> — 60 characters total
Spring API:  encoder.encode(plaintext) → hash
             encoder.matches(plaintext, storedHash) → boolean
             
NEVER use:   MessageDigest (SHA-1, SHA-256, MD5) — non-adaptive, GPU-crackable
NEVER use:   String comparison on hashes — timing attack vulnerability
```

### 4.4 Scoring Algorithm (QuizService.evaluate)

```
Input:  studentAnswers = List<{questionId: Long, selectedOption: int}>
        quiz = Quiz entity with List<Question> (each Question has correctOptionIndex, points)

Algorithm:
  answerMap = Map<questionId, selectedOption> from studentAnswers
  totalPoints = sum(question.points for question in quiz.questions)
  earnedPoints = sum(
    question.points
    for question in quiz.questions
    if answerMap.get(question.id) == question.correctOptionIndex
  )
  score = (earnedPoints / totalPoints) * 100.0  // double arithmetic, not integer
  passed = score >= quiz.passingScore

Certificate generation condition:
  passed == true
  AND NOT EXISTS quiz_results where student_id=X AND quiz_id=Y (already enforced by UNIQUE constraint)
  Certificate.certificateCode = UUID.randomUUID().toString()

Output: QuizResultResponse {score, passed, passingScore, submittedAt, certificateCode or null}
```

---

## SECTION 5 — FRONTEND LAYER SPECIFICATION

### 5.1 TypeScript Type System

```typescript
// Ground truth types — backend responses MUST match these shapes
type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

// AuthContext state shape
interface AuthState {
  token: string | null;       // JWT string or null if not logged in
  role: Role | null;
  userId: number | null;      // maps to users.id (Long → number in TS)
  fullName: string | null;
}

// No 'any' types permitted — TypeScript strict mode should be enabled
// tsconfig.json: "strict": true
```

### 5.2 Services Layer Contract

```
All API calls MUST be made through the service functions in src/services/api.ts
Components MUST NOT import axios or call fetch directly
The Axios instance in api.ts MUST attach the JWT via request interceptor

File:    src/services/api.ts
Exports: authService, courseService, enrollmentService, quizService, adminService

Each service export is an object whose methods return AxiosPromise<T> where T is the
TypeScript type matching the backend's JSON response shape.
```

### 5.3 Routing and Access Control

```
Route                      Component              Access
/register                  RegisterPage           Public
/login                     LoginPage              Public (redirect to dashboard if authenticated)
/student/dashboard         StudentDashboard       STUDENT role only
/instructor/dashboard      InstructorDashboard    INSTRUCTOR role only
/admin/dashboard           AdminDashboard         ADMIN role only
/course/:id                CourseDetailPage       STUDENT role (authenticated)
/course/:id/attend         CourseAttendPage       STUDENT role AND enrolled
/course/:id/quiz/:quizId   QuizPage               STUDENT role AND enrolled
/quiz/:quizId/result       QuizResultPage         STUDENT role (own result)

ProtectedRoute component wraps all authenticated routes.
Role mismatch redirects to the correct role's dashboard, not to /login.
Unauthenticated access redirects to /login.
```

### 5.4 Button State Invariant (Course Detail Page)

```
This invariant is load-bearing — it ensures the UI reflects real server state.

On CourseDetailPage mount:
  1. GET /api/courses/{id} → loads course data
  2. GET /api/enrollments/status/{id} → loads enrollment status

Button states derived from enrollment status:
  status.enrolled == false   → [Enroll: active] [Attend: disabled] [Drop: disabled]
  status.status == 'ACTIVE'  → [Enroll: disabled] [Attend: active] [Drop: active]
  status.status == 'DROPPED' → [Enroll: active] [Attend: disabled] [Drop: disabled]
  status.status == 'COMPLETED'→ [Enroll: disabled] [Attend: active] [Drop: disabled]

Button states MUST NOT be derived from local React state without a server call.
After enroll() resolves: re-fetch enrollment status (or optimistically update to ACTIVE).
After drop() resolves: re-fetch enrollment status (or optimistically update to DROPPED).
```

---

## SECTION 6 — API CONTRACT SPECIFICATION

Full specification. HTTP method, path, auth requirement, request body, success response,
all error responses, and the business rule being enforced.

```
METHOD  PATH                                 AUTH              REQUEST BODY                    SUCCESS  ERRORS
──────  ───────────────────────────────────  ────────────────  ──────────────────────────────  ───────  ──────────────────────────────
POST    /api/auth/register                   None              {fullName, email, password,     201      400 email exists
                                                                role}                                   400 invalid role
                                                                                                        400 validation failure

POST    /api/auth/login                      None              {email, password}               200      401 bad credentials (unified msg)
                                                                                                        403 not approved

GET     /api/courses                         JWT (any role)    —                               200      401 no/invalid token

GET     /api/courses/{id}                    JWT (any role)    —                               200      401, 404

POST    /api/courses                         JWT (INSTRUCTOR)  {title, description, imageUrl}  201      401, 403, 400 validation

PUT     /api/courses/{id}                    JWT (INSTRUCTOR,  {title, description, imageUrl}  200      401, 403 not owner, 404
                                              own course)

POST    /api/enrollments                     JWT (STUDENT)     {courseId}                      201      401, 403 not student
                                                                                                        404 course not found
                                                                                                        409 already enrolled

DELETE  /api/enrollments/{courseId}          JWT (STUDENT)     —                               200      400 not enrolled, 401

GET     /api/enrollments/my-courses          JWT (STUDENT)     —                               200      401

GET     /api/enrollments/status/{courseId}   JWT (STUDENT)     —                               200      401

POST    /api/courses/{id}/quizzes            JWT (INSTRUCTOR)  {title, timeLimitMinutes,       201      401, 403, 404
                                                                passingScore,
                                                                questions: [{questionText,
                                                                  options[], correctOption
                                                                  Index, points}]}

GET     /api/quizzes/{quizId}                JWT (STUDENT,     —                               200      401, 403 not enrolled, 404
                                              enrolled)

POST    /api/quizzes/{quizId}/submit         JWT (STUDENT)     {answers: [{questionId,         200      401, 403, 404
                                                                selectedOption}]}                        409 already attempted

GET     /api/quizzes/{quizId}/results        JWT (STUDENT,     —                               200      401, 403, 404
                                              own result)

GET     /api/admin/users                     JWT (ADMIN)       ?approved=false (optional)      200      401, 403

PATCH   /api/admin/users/{id}/approve        JWT (ADMIN)       —                               200      401, 403, 404

PATCH   /api/admin/users/{id}/revoke         JWT (ADMIN)       —                               200      401, 403, 404
```

**HTTP status code semantics used in this system:**
```
200  OK — successful GET, PUT, PATCH, DELETE
201  Created — successful POST that creates a resource
400  Bad Request — client error: validation failure, business rule violation (not enrolled, etc.)
401  Unauthorized — authentication failure (missing/invalid JWT, wrong credentials)
403  Forbidden — authentication passed but authorization failed (wrong role, not approved)
404  Not Found — resource does not exist
409  Conflict — state conflict (already enrolled, already attempted)
500  Internal Server Error — unexpected server fault
```

Reference: https://www.rfc-editor.org/rfc/rfc9110#section-15

---

## SECTION 7 — CROSS-CUTTING CONCERNS

### 7.1 Error Response Schema

All error responses follow a consistent shape to allow the frontend to parse them uniformly:

```json
{
  "status":  404,
  "error":   "Not Found",
  "message": "Course not found: 42"
}
```

The `GlobalExceptionHandler` (@RestControllerAdvice) maps every domain exception to this shape.
Frontend error handling: `err.response?.data?.message` extracts the human-readable message
for display. Do not show raw stack traces to the frontend.

Reference for problem details standard: https://www.rfc-editor.org/rfc/rfc7807

### 7.2 CORS Configuration

```
Allowed origins: http://localhost:3000 (configured in application.properties)
Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Allowed headers: * (all)
Allow credentials: true
```

The React app runs on port 3000 (Create React App default). The Spring Boot API runs on 8080.
The `proxy` field in `frontend/package.json` proxies `/api/*` from 3000 → 8080 during development.
In production, a reverse proxy (nginx, AWS ALB) handles this — not in scope for current sprints.

### 7.3 Naming Convention Mapping

```
Java field name    → DB column name      (snake_case mapping required)
─────────────────────────────────────────────────────────────────────
fullName           → full_name
passwordHash       → password_hash
createdAt          → created_at
orderIndex         → order_index
timeLimitMinutes   → time_limit_minutes
passingScore       → passing_score
progressPercent    → progress_percent
enrolledAt         → enrolled_at
submittedAt        → submitted_at
issuedAt           → issued_at
certificateCode    → certificate_code
imageUrl           → image_url
contentUrl         → content_url
instructorId       → instructor_id
studentId          → student_id
courseId           → course_id
quizId             → quiz_id
correctOptionIndex → correct_option_index
```

Critical application.properties configuration required for this mapping:
```
spring.jpa.hibernate.naming.physical-strategy=
  org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
```
Without this, Hibernate's default naming strategy converts camelCase to camelCase
(not snake_case), causing `full_name` in the DB to be unrecognised as `fullName` in Java.
With `ddl-auto=validate`, this mismatch causes a startup failure.

### 7.4 Transaction Boundaries

```
@Transactional placement: SERVICE LAYER METHODS ONLY
Controllers are never @Transactional
Repositories are implicitly transactional for individual operations

Methods that must be @Transactional:
  AuthService.register()          — user save + potential rollback on constraint violation
  EnrollmentService.enroll()      — enrollment save
  EnrollmentService.drop()        — enrollment status update
  QuizService.evaluate()          — quiz_result save + certificate save (must be atomic)
  AdminService.approveUser()      — user approved field update
  AdminService.revokeUser()       — user approved field update

The evaluate() method is the most critical: if quiz_result saves but certificate save fails,
the student gets no certificate but also cannot retake (UNIQUE constraint on quiz_result).
Both saves must succeed or both must roll back — hence @Transactional.
```

---

## SECTION 8 — KNOWN DESIGN DECISIONS AND THEIR RATIONALE

### Decision 8.1: Why the Approval Check is in the Service, Not Just in Security Config

Spring Security's `permitAll` / `authenticated` / `hasRole` operates at the HTTP layer before
the service is called. However, Spring Security does not know about application-level concepts
like `approved`. Two options exist:

**Option A:** Implement `UserDetailsService`, load the user from the DB in the security filter,
check `approved` during authentication. This is the "Spring-idiomatic" approach but couples
the security layer to the `UserRepository`.

**Option B (chosen):** Perform the `approved` check inside `AuthService.login()`. The security
filter chain only validates the JWT for existing sessions. The `approved` check happens at login
time where it semantically belongs — in the business logic layer.

Rationale for Option B: This system intentionally keeps the security layer thin and the service
layer responsible for business rules. Mixing business state (approval) into the security filter
couples infrastructure to domain logic, violating the dependency inversion principle.

Reference: https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/user-details-service.html

### Decision 8.2: Why Course.published Defaults to False

Instructors need to prepare a course before students see it. An auto-published course forces
instructors to race to add materials before students can enroll in an empty course.
The `published` flag gives instructors explicit control. This mirrors the pattern used by
Canvas LMS and Moodle's "course availability" settings.

### Decision 8.3: Why Enrollments Are Never Deleted

Deleting enrollments on drop creates two problems:
1. Loss of enrollment history — the system cannot report "how many students have ever enrolled"
2. Re-enrollment counts as a first enrollment — breaking any analytics that depend on enrollment date

The state machine (ACTIVE → DROPPED → back to ACTIVE via new row) preserves full history
while allowing the system to query `WHERE status = 'ACTIVE'` for current enrollment checks.

Note on re-enrollment: when a student re-enrolls in a course they previously dropped, the
existing DROPPED row is NOT updated — a new ACTIVE row is inserted. The UNIQUE constraint
`(student_id, course_id)` must therefore be removed or changed to allow multiple rows
with different statuses. **This is a schema design issue that must be resolved before
Sprint 3 re-enrollment is implemented.** Current constraint design prevents re-enrollment.

**Recommended resolution:** Remove the UNIQUE(student_id, course_id) constraint from the table.
Enforce uniqueness of ACTIVE enrollments at the service layer: check `WHERE student_id=X AND course_id=Y AND status='ACTIVE'` before inserting. This preserves the business rule while allowing historical records.

### Decision 8.4: Time Limit Enforcement Is Client-Side

The quiz `time_limit_minutes` is enforced by the React countdown timer. The server does not
track quiz start times or reject submissions after the deadline.

**Why:** Implementing server-side time enforcement requires storing a `quiz_start_time` per
attempt, then validating `submitted_at - quiz_start_time <= time_limit`. This adds a table
column, a start-quiz endpoint, and clock synchronisation complexity. For a university LMS
at this scale, client-side enforcement is the correct scope decision.

**Known limitation:** A student who disables JavaScript or intercepts requests can bypass
the timer. Acceptable for this context. Production LMS systems (e.g., Respondus) use
proctoring software to address this — out of scope here.

### Decision 8.5: Why `correct_option_index` Is an Int, Not an Enum

Options are a variable-length list (default 4, but extensible to 5 or 2). An index-based
approach is more flexible than hardcoded A/B/C/D values. The index 0–3 maps to the first–fourth
element of the JSONB options array.

---

## SECTION 9 — SPRINT DELIVERY SEQUENCE AND DEPENDENCY GRAPH

```
                   Sprint 1
                   ────────
   users table ──→ AuthService ──→ AuthController ──→ RegisterPage + LoginPage + AuthContext
                                                             │
                               ┌───────────────────────────┘
                               ↓
                   Sprint 2
                   ────────
   courses table ──→ CourseService ──→ CourseController ──→ StudentDashboard + CourseDetailPage
   enrollments table ──→ EnrollmentService ──→ EnrollmentController ──→ CourseAttendPage
   course_materials table                                              ──→ InstructorDashboard
                               │
                               ↓
                   Sprint 3
                   ────────
   quizzes table ──→ QuizService ──→ QuizController ──→ QuizPage + QuizResultPage
   questions table                                    ──→ CertificatePage
   quiz_results table ──→ AdminService ──→ AdminController ──→ AdminDashboard
   certificates table
```

**Hard dependency:** Sprint N+1 cannot begin before Sprint N's database schema and backend
auth endpoints are merged to `dev`. The UI team can build Sprint 2 pages with mock data,
but integration requires the Sprint 1 backend to be running.

---

## SECTION 10 — TRAINING DATASET REFERENCES FOR MODEL ALIGNMENT

The following datasets, codebases, and documentation sets are recommended for fine-tuning
or in-context learning to produce responses consistent with this system's decisions.

### Java / Spring Boot

**Spring Initializr generated projects (reference for pom.xml structure)**
https://start.spring.io/

**Spring Boot official samples repository**
https://github.com/spring-projects/spring-boot/tree/main/spring-boot-tests/spring-boot-smoke-tests

**Spring Security samples (JWT + stateless REST)**
https://github.com/spring-projects/spring-security-samples
Specifically: `servlet/spring-boot/java/jwt/login` sample

**Baeldung Spring Security JWT tutorial (widely reproduced, high-quality)**
https://www.baeldung.com/spring-security-oauth-jwt
https://www.baeldung.com/spring-boot-security-autoconfiguration

**Real World App — Spring Boot backend (conduit.io spec)**
https://github.com/gothinkster/spring-boot-realworld-example-app
This codebase implements JWT auth, user roles, and layered architecture at production quality.
It is one of the best single reference implementations for the patterns used here.

**JPA Inheritance examples (Hibernate official)**
https://github.com/hibernate/hibernate-orm/tree/main/documentation/src/test/java/org/hibernate/userguide/inheritance

### PostgreSQL

**PostgreSQL sample databases**
https://www.postgresql.org/ftp/projects/pgFoundry/dbsamples/
**Trigger examples**
https://www.postgresql.org/docs/14/trigger-example.html

### React + TypeScript

**Real World App — React/TypeScript frontend (conduit.io spec)**
https://github.com/gothinkster/react-redux-realworld-example-app
**TypeScript React Cheatsheet**
https://react-typescript-cheatsheet.netlify.app/

### Security

**OWASP WebGoat (deliberately vulnerable application — for understanding attack patterns)**
https://github.com/WebGoat/WebGoat
**OWASP Juice Shop**
https://github.com/juice-shop/juice-shop

### LMS Architecture Reference

**Moodle source code (PHP, but LMS data model is directly comparable)**
https://github.com/moodle/moodle
Relevant: `/user/`, `/course/`, `/mod/quiz/` directories

**Canvas LMS open source**
https://github.com/instructure/canvas-lms
Relevant: `app/models/enrollment.rb` — state machine for enrollment (Ruby but directly comparable)
`app/models/quiz/` — quiz submission and scoring model

---

## SECTION 11 — PROMPT ENGINEERING NOTES FOR AI ASSISTANTS

When answering questions about this system, an AI model should apply the following priors:

**Prior 1:** When asked for code, default to the named technology stack (Java 17, Spring Boot 3.2,
React 18, TypeScript 5, PostgreSQL 14). Do not suggest alternatives unless the user asks.

**Prior 2:** When suggesting backend code, enforce the Controller→Service→Repository boundary.
If a user pastes code that puts business logic in a controller, flag it and move it to the service.

**Prior 3:** The `correct_option_index` field is toxic to the API surface. Any suggestion that
would expose it (including logging, error messages, or debug endpoints) should be refused.

**Prior 4:** Password handling: if the user asks about comparing passwords, comparing the hash
is wrong. The correct answer is always `passwordEncoder.matches(rawPassword, storedHash)`.

**Prior 5:** The `ddl-auto=validate` setting means the schema must be created by running
`schema.sql` manually. `ddl-auto=create` is for early development only and destroys existing
data on restart. Never suggest `create-drop` for any environment.

**Prior 6:** Spring Security 6 uses the lambda DSL. `WebSecurityConfigurerAdapter` was removed
in Spring Boot 3.x. If the user is on Spring Boot 3, any suggestion using
`WebSecurityConfigurerAdapter` is wrong and will not compile.

**Prior 7:** `@AuthenticationPrincipal Long userId` works because JwtFilter sets
`UsernamePasswordAuthenticationToken(userId, null, authorities)` where `userId` is a `Long`.
If any other type is set as the principal, this annotation will throw a ClassCastException.

**Prior 8:** The enrollment UNIQUE constraint issue (Section 8.3) is a known open design problem.
If asked about re-enrollment, always surface this constraint conflict and recommend the service-layer
uniqueness check approach as the resolution.

---

## SECTION 12 — SYSTEM BOUNDARIES AND OUT-OF-SCOPE ITEMS

The following capabilities are explicitly outside the system's current scope. An AI model
asked about implementing these should decline and note they are future-sprint items:

- Email verification on registration (no SMTP integration)
- Password reset / forgot password flow
- OAuth2 / social login (Google, GitHub)
- File/video upload (all content is URL-reference only)
- Real-time features (WebSocket, Server-Sent Events)
- Mobile native apps (React Native, Flutter)
- CI/CD pipelines (GitHub Actions, Jenkins)
- Containerisation (Docker, Kubernetes)
- Production deployment (AWS, GCP, Heroku)
- Rate limiting and request throttling
- Admin panel course management (admin can only manage users in Sprint 3)
- Multiple quiz attempts per student
- Quiz retake after failure
- Course completion percentage auto-calculation
- Notification system (email, in-app)
- Certificate PDF generation (Sprint 3 issues a code, not a PDF)
- Payment / subscription model
- Content recommendation engine
- Analytics dashboard

---

*Document version: 1.0*
*Generated from conversation history with osvald-27*
*Repository: https://github.com/osvald-27/elearning-platform*
*Last known repo state: 1 commit, database/ folder, API_CONTRACTS.md (empty), README.md*
