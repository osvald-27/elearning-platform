# Fold E-Learning Platform — Project Documentation
## CEF331 Group 12 | University of Buea

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Getting Started](#3-getting-started)
4. [Project Structure](#4-project-structure)
5. [Database](#5-database)
6. [Backend — Spring Boot API](#6-backend)
7. [Frontend — React + TypeScript](#7-frontend)
8. [Sprint Breakdown](#8-sprint-breakdown)
9. [API Reference](#9-api-reference)
10. [OOP and Design Concepts](#10-oop-and-design-concepts)
11. [Business Rules](#11-business-rules)
12. [Deployment Notes](#12-deployment-notes)

---

## 1. Project Overview

Fold is a web-based e-learning platform built for the University of Buea as part of CEF331. It allows students to discover and enroll in courses, instructors to create and manage course content, and administrators to approve accounts and monitor platform activity.

The name "Fold" reflects the concept of knowledge unfolding through structured learning.

**Three user roles:**
- **Student** — discovers courses, enrolls, attends materials
- **Instructor** — creates courses, adds materials, publishes content
- **Admin** — approves accounts, monitors platform stats

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java 25 + Spring Boot 4.0.6 |
| Security | Spring Security 6 + JJWT 0.12.6 + BCrypt |
| Persistence | Spring Data JPA + Hibernate + HikariCP |
| Database | PostgreSQL 14+ |
| Frontend | React 18 + TypeScript 5 + Vite 5 |
| HTTP Client | Axios 1.6 |
| Routing | React Router 6 |
| Fonts | Google Fonts — Carter One, Bebas Neue, Inter |

---

## 3. Getting Started

### Prerequisites

- Java 25 JDK
- Apache Maven 3.9+
- PostgreSQL 14+ (running on port 5432)
- Node.js 18+ and npm

### Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE elearning_platform;"

# Sprint 1 — users table + trigger
psql -U postgres -d elearning_platform -f database/schema.sql
psql -U postgres -d elearning_platform -f database/seed.sql

# Sprint 2 — courses, enrollments, materials
psql -U postgres -d elearning_platform -f database/migration_sprint2.sql
psql -U postgres -d elearning_platform -f database/seed_sprint2.sql

# Sprint 3 — quizzes, certificates, feedback
psql -U postgres -d elearning_platform -f database/migration_sprint3.sql
```

### Backend

```bash
cd backend
mvn package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Backend starts on `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:3000`.

### Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | oswaldkarisma27@gmail.com | admin123 |
| Instructor | instructor@elearning.ub.cm | instructor123 |
| Student | student@elearning.ub.cm | student123 |

---

## 4. Project Structure

```
elearning-platform/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/elearning/backend/
│       ├── BackendApplication.java
│       ├── entity/          User, Student, Instructor, Admin, Role,
│       │                    Course, CourseMaterial, Enrollment,
│       │                    EnrollmentStatus, MaterialType
│       ├── dto/             RegisterRequest, LoginRequest, LoginResponse,
│       │                    MessageResponse, CourseResponse,
│       │                    CourseDetailResponse, MaterialResponse,
│       │                    CreateCourseRequest, EnrollmentResponse,
│       │                    EnrollmentStatusResponse
│       ├── repository/      UserRepository, CourseRepository,
│       │                    EnrollmentRepository
│       ├── service/         AuthService, CourseService,
│       │                    EnrollmentService, AdminService
│       ├── controller/      AuthController, CourseController,
│       │                    EnrollmentController, AdminController
│       ├── exception/       GlobalExceptionHandler + 7 exception classes
│       └── security/        JwtUtil, JwtFilter, SecurityConfig
├── database/
│   ├── schema.sql              Sprint 1 — users
│   ├── seed.sql                Admin seed account
│   ├── migration_sprint2.sql   Courses, enrollments, materials
│   ├── seed_sprint2.sql        Sample courses and materials
│   └── migration_sprint3.sql   Quizzes, certificates, feedback
├── frontend/
│   ├── public/             logo.png, book.svg, pencil.svg, briefcase.svg
│   ├── src/
│   │   ├── styles/         global.css (Fold design system)
│   │   ├── types/          index.ts
│   │   ├── services/       api.ts
│   │   ├── context/        AuthContext.tsx
│   │   ├── components/     Sidebar.tsx, ProtectedRoute.tsx
│   │   └── pages/          HomePage, AboutPage, GetStartedPage,
│   │                        LoginPage, RegisterPage, PublicCoursesPage,
│   │                        CourseDetailPage, CourseAttendPage,
│   │                        StudentDashboard, InstructorDashboard,
│   │                        AdminDashboard
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
└── docs/
    └── DOCUMENTATION.md
```

---

## 5. Database

### Schema Overview

**users** — single table for all three roles using SINGLE_TABLE JPA inheritance.

| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | Auto-generated |
| full_name | VARCHAR(150) NOT NULL | |
| email | VARCHAR(255) UNIQUE NOT NULL | Indexed |
| password_hash | VARCHAR(255) NOT NULL | BCrypt, never exposed |
| role | user_role ENUM | STUDENT / INSTRUCTOR / ADMIN |
| approved | BOOLEAN DEFAULT FALSE | Trigger auto-sets TRUE for students |
| created_at | TIMESTAMP DEFAULT NOW() | |

**Trigger:** `trg_auto_approve_student` — fires BEFORE INSERT, sets `approved = TRUE` when `role = 'STUDENT'`.

**courses**

| Column | Notes |
|---|---|
| instructor_id | FK → users, ON DELETE SET NULL |
| published | DEFAULT FALSE — courses start as drafts |

**course_materials**

| Column | Notes |
|---|---|
| course_id | FK → courses, ON DELETE CASCADE |
| material_type | ENUM: TEXT, VIDEO, FILE, LINK |
| order_index | Controls display order |

**enrollments**

| Column | Notes |
|---|---|
| student_id + course_id | UNIQUE composite constraint |
| status | ACTIVE or DROPPED — never deleted |

**Sprint 3 tables:** quizzes, questions, quiz_results, certificates, feedback — all scaffolded in `migration_sprint3.sql`.

---

## 6. Backend

### Architecture

The backend follows strict three-layer architecture:

```
Controller → Service → Repository → Database
```

Controllers receive HTTP, delegate to services, return ResponseEntity. Services contain all business logic. Repositories handle SQL generation through Spring Data JPA. No business logic belongs in controllers or repositories.

### Security Flow

```
HTTP Request
  → JwtFilter (validate Bearer token, set SecurityContext)
  → SecurityConfig (URL-level authorization: /api/auth/** permitAll)
  → @PreAuthorize (method-level role check: STUDENT / INSTRUCTOR / ADMIN)
  → Controller
  → Service (resource-level ownership check if needed)
```

### JWT Structure

```json
{
  "sub": "3",
  "role": "STUDENT",
  "iat": 1716800000,
  "exp": 1716886400
}
```

Signed with HMAC-SHA256. Expires after 24 hours. The `sub` claim is the user's database ID (as string per RFC 7519). The `role` claim drives `@PreAuthorize` checks.

### Key Design Decisions

**SINGLE_TABLE inheritance** — all three user subtypes (Student, Instructor, Admin) share the `users` table with a discriminator column. Every auth query is a simple SELECT with no JOINs.

**Defence in depth on student approval** — three independent layers: `Student()` constructor sets `approved=true`, `AuthService.register()` handles it explicitly, PostgreSQL trigger enforces it at the DB level.

**Unified 401 on login failure** — wrong email and wrong password return the same `"Invalid credentials"` message. This prevents user enumeration (OWASP Authentication Cheat Sheet §1.2).

**Soft delete for enrollments** — dropping a course sets `status = DROPPED` and saves the record. The row is never deleted. History is preserved for analytics and audit.

**Unpublished = 404** — attempting to access an unpublished course returns the same 404 as a non-existent course. Students cannot tell whether a course ID exists but is draft vs. genuinely missing.

---

## 7. Frontend

### Design System — Fold

The Fold design system is defined in `src/styles/global.css`. It uses:

- **Carter One** — display headings and hero titles
- **Bebas Neue** — sidebar navigation
- **Inter** — body text and UI elements

**Color palette:**

| Variable | Value | Use |
|---|---|---|
| `--bg` | `#c8e6c9` | Page background (green tint) |
| `--white` | `#ffffff` | Cards, forms |
| `--black` | `#000000` | Headers, bold text |
| `--green` | `#4caf50` | Primary actions |
| `--yellow` | `#ffc107` | Menu button, accent |
| `--red` | `#e53935` | Destructive actions |

**Key components:**
- `.page` / `.inner-page` — page wrapper
- `.site-header` — logo bar centered at top
- `Sidebar` — sliding nav triggered by the yellow hamburger button (fixed top-left)
- `.card-grid` — 3-column responsive course grid
- `.dashboard-header` — black header bar for authenticated dashboards
- `.fold-table` — admin data tables
- `.primary-btn` / `.danger-btn` — pill-shaped action buttons

### State Management

Auth state is stored in `AuthContext` (React Context) and persisted to `localStorage`. On mount, `AuthContext` reads from `localStorage` to rehydrate the session — users stay logged in across page refreshes.

### Route Structure

| Path | Component | Auth Required |
|---|---|---|
| `/` | HomePage | No |
| `/about` | AboutPage | No |
| `/get-started` | GetStartedPage | No |
| `/login` | LoginPage | No |
| `/register` | RegisterPage | No |
| `/courses` | PublicCoursesPage | No (previews for guests) |
| `/student/dashboard` | StudentDashboard | STUDENT |
| `/courses/:id` | CourseDetailPage | STUDENT |
| `/courses/:id/attend` | CourseAttendPage | STUDENT (enrolled) |
| `/instructor/dashboard` | InstructorDashboard | INSTRUCTOR |
| `/admin/dashboard` | AdminDashboard | ADMIN |

### API Service Layer

All HTTP calls go through `src/services/api.ts`. An Axios interceptor automatically attaches the Bearer token to every request. Components never import Axios directly — they always use the service objects (`authService`, `courseService`, `enrollmentService`, `adminService`).

---

## 8. Sprint Breakdown

### Sprint 1 — Identity Layer

**Goal:** Users can register, log in, and the system knows who they are.

**Delivered:**
- `users` table with PostgreSQL enum, trigger, and indexes
- Abstract `User` entity with SINGLE_TABLE inheritance (`Student`, `Instructor`, `Admin`)
- `AuthService` — register with BCrypt, login with JWT, approval check
- `JwtUtil` — HMAC-SHA256 token generation and parsing (JJWT 0.12.6)
- `JwtFilter` — Bearer token validation on every request
- `SecurityConfig` — stateless session, CORS, method security
- `GlobalExceptionHandler` — consistent `{"error":"..."}` responses
- Frontend: Home, About, GetStarted, Login, Register pages with Fold design

**Key business rules:**
- Students auto-approved; Instructors and Admins require admin action
- Login order: email → password → approved (same 401 for steps 1 and 2)
- `passwordHash` never appears in any DTO or API response

### Sprint 2 — Learning Layer

**Goal:** Students can discover courses, enroll, and attend materials. Instructors can create and publish courses.

**Delivered:**
- `courses`, `course_materials`, `enrollments` tables
- `Course`, `CourseMaterial`, `Enrollment` entities
- `CourseService` — getPublished, getDetail (JOIN FETCH), createCourse, publishCourse
- `EnrollmentService` — enroll, drop (soft), getMyCourses, getStatus, isActivelyEnrolled
- `CourseController` — 6 endpoints, `@PreAuthorize` role gating
- `EnrollmentController` — 4 endpoints
- Frontend: StudentDashboard (course grid + search + enrolled row), CourseDetailPage (enrollment state machine), CourseAttendPage (materials by type), InstructorDashboard (create + publish)

**Key business rules:**
- Courses start as unpublished drafts
- Only owning instructor can publish their course
- Dropping a course preserves the enrollment record
- Only actively enrolled students can attend materials

### Sprint 3 — Administration Layer

**Goal:** Admins can approve accounts, monitor platform stats, and manage users.

**Delivered:**
- `quizzes`, `questions`, `quiz_results`, `certificates`, `feedback` tables (schema only — quiz UI is Sprint 4 scope)
- `AdminService` — getPendingUsers, getAllUsers, approveUser, rejectUser, getStats
- `AdminController` — 5 endpoints, all gated with `hasRole('ADMIN')`
- Frontend: AdminDashboard with three tabs — Overview (stats + pending approval table), Pending (dedicated approval management), All Users (full user table with approve/disable actions)

**Key business rules:**
- Admins cannot approve themselves
- Approving a pending user sets `approved = true` and allows login
- Disabling an active user sets `approved = false` and blocks login

---

## 9. API Reference

### Auth Endpoints (public)

| Method | URL | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `RegisterRequest` | 201 `MessageResponse` |
| POST | `/api/auth/login` | `LoginRequest` | 200 `LoginResponse` |

**RegisterRequest:**
```json
{ "fullName": "Jane Doe", "email": "jane@ub.cm", "password": "mypassword", "role": "STUDENT" }
```

**LoginResponse:**
```json
{ "token": "eyJ...", "role": "STUDENT", "userId": 3, "fullName": "Jane Doe" }
```

### Course Endpoints

| Method | URL | Role | Description |
|---|---|---|---|
| GET | `/api/courses` | STUDENT | All published courses |
| GET | `/api/courses/{id}` | STUDENT | Course detail + materials |
| GET | `/api/courses/{id}/attend` | STUDENT (enrolled) | Materials (gated) |
| GET | `/api/courses/instructor/my-courses` | INSTRUCTOR | Own courses (all) |
| POST | `/api/courses` | INSTRUCTOR | Create draft course |
| PATCH | `/api/courses/{id}/publish` | INSTRUCTOR (owner) | Publish a draft |

### Enrollment Endpoints

| Method | URL | Role | Description |
|---|---|---|---|
| POST | `/api/enrollments/{courseId}` | STUDENT | Enroll |
| PATCH | `/api/enrollments/{courseId}/drop` | STUDENT | Drop (soft) |
| GET | `/api/enrollments/my-courses` | STUDENT | Active enrollments |
| GET | `/api/enrollments/{courseId}/status` | STUDENT | Enrollment status |

### Admin Endpoints

| Method | URL | Role | Description |
|---|---|---|---|
| GET | `/api/admin/pending-users` | ADMIN | Users with approved=false |
| GET | `/api/admin/users` | ADMIN | All users |
| PATCH | `/api/admin/users/{id}/approve` | ADMIN | Set approved=true |
| PATCH | `/api/admin/users/{id}/reject` | ADMIN | Set approved=false |
| GET | `/api/admin/stats` | ADMIN | Platform statistics |

### Error Response Format

All errors follow this shape:
```json
{ "error": "Human-readable error message" }
```

Common status codes:

| Code | Meaning |
|---|---|
| 400 | Bad Request (validation failure, duplicate email) |
| 401 | Unauthorized (wrong credentials) |
| 403 | Forbidden (not approved, wrong role, wrong ownership) |
| 404 | Not Found (resource missing or unpublished) |
| 409 | Conflict (already enrolled) |

---

## 10. OOP and Design Concepts

### Encapsulation

`passwordHash` in `User` is `private` with no public setter accepting plaintext. Only `AuthService` calls `user.setPasswordHash(passwordEncoder.encode(input))` — the raw password never touches the entity. No DTO exposes `passwordHash`. The absence of the field in DTOs makes the security property structural, not conventional.

Course publishing is also encapsulated: only `CourseService.publishCourse()` can set `published = true`, and only after verifying ownership. Controllers cannot set `published` directly.

### Inheritance

```
User (abstract)
├── Student   → @DiscriminatorValue("STUDENT"), approved=true in constructor
├── Instructor → @DiscriminatorValue("INSTRUCTOR"), approved=false
└── Admin      → @DiscriminatorValue("ADMIN"), approved=false
```

SINGLE_TABLE strategy stores all subtypes in one table. The `role` column serves as both the JPA discriminator and the business role attribute. `User` is abstract — `new User()` does not compile, enforcing that every account has a type.

### Polymorphism

`AuthService.register()` uses an exhaustive switch on the `Role` enum to produce the correct subtype. The Java compiler guarantees all cases are handled — adding a new role without updating the switch prevents compilation.

Spring Data repositories demonstrate interface polymorphism: `UserRepository`, `CourseRepository`, and `EnrollmentRepository` all extend `JpaRepository`. Spring creates proxy implementations at startup that generate correct SQL for each entity type.

`GlobalExceptionHandler` demonstrates method-level polymorphism (overloading): eight `@ExceptionHandler` methods named for their exception type, each returning the appropriate HTTP status.

### Abstraction

`UserRepository` is an interface — no implementation. Two method signatures declare intent; Spring Data generates the SQL at runtime. `AuthService` uses the repository without knowing anything about Hibernate, JDBC, or SQL.

DTOs are the abstraction layer between the domain model and the HTTP world. `CourseResponse` flattens `course.instructor.fullName` to a plain `instructorName: string`. The client never sees `User` objects, never navigates object graphs, never triggers lazy loading.

### Association Patterns

**Association** — `Course` → `User` (instructor): `@ManyToOne(fetch = LAZY)`. Course knows its instructor. Instructor does not know its courses in the entity. Navigable one-way.

**Composition** — `Course` ↔ `CourseMaterial`: `@OneToMany(cascade = ALL, orphanRemoval = true)`. Materials live and die with their course. `ON DELETE CASCADE` in SQL mirrors this.

**Association Class** — `Enrollment` models the Student ↔ Course many-to-many with its own attributes: `status`, `progressPercent`, `enrolledAt`. A pure `@ManyToMany` would lose this data. `Enrollment` is an entity in its own right.

### SOLID

**Single Responsibility** — every class has one job. `JwtUtil` generates/parses tokens. `JwtFilter` extracts auth context from requests. `SecurityConfig` defines URL rules. `AuthService` applies auth business rules. If the JWT algorithm changes, only `JwtUtil` changes.

**Open/Closed** — `GlobalExceptionHandler` is open for extension (add a new `@ExceptionHandler` method) and closed for modification (existing handlers are untouched). `AdminService.getStats()` can gain new metrics without changing any existing method.

**Liskov Substitution** — anywhere `User` is expected, `Student`, `Instructor`, or `Admin` can be substituted. `EnrollmentService` stores a `User student` reference; at runtime it holds a `Student` object. All `User` contracts are honoured.

**Interface Segregation** — `CourseRepository` has only course-related queries; `EnrollmentRepository` has only enrollment queries. `EnrollmentService` depends only on `EnrollmentRepository` — not forced to depend on course query methods it does not use.

**Dependency Inversion** — `AuthService` depends on `PasswordEncoder` (interface), not `BCryptPasswordEncoder` (concretion). Swapping BCrypt for Argon2 requires changing one bean declaration in `SecurityConfig`; `AuthService` does not change.

---

## 11. Business Rules

| # | Rule | Enforcement |
|---|---|---|
| BR-001 | Students auto-approved on registration | Constructor + AuthService + DB trigger |
| BR-002 | Instructors and Admins require admin approval | Constructor defaults + login check |
| BR-003 | Password hash never exposed in API | No field in any DTO |
| BR-004 | Wrong email and wrong password return same 401 | Unified `"Invalid credentials"` message |
| BR-005 | Every course starts as an unpublished draft | Constructor + explicit set in service + DB default |
| BR-006 | Only owning instructor can publish their course | `.equals()` ownership check in service |
| BR-007 | Unpublished courses return 404, not 403 | Same exception for both cases |
| BR-008 | A student can only enroll once per course | Service existence check + DB UNIQUE constraint |
| BR-009 | Dropping a course preserves the enrollment record | `setStatus(DROPPED)` never `delete()` |
| BR-010 | Only actively enrolled students can attend materials | `isActivelyEnrolled()` check in controller |
| BR-011 | Materials ordered by order_index ascending | `@OrderBy` + manual sort + composite index |
| BR-012 | Deleting a course deletes all its materials | `ON DELETE CASCADE` + JPA `orphanRemoval = true` |
| BR-013 | Deleting instructor preserves their courses | `ON DELETE SET NULL` on courses.instructor_id |
| BR-014 | Admin cannot approve themselves | `userId.equals(adminId)` check with ForbiddenException |
| BR-015 | JWT tokens expire after 24 hours | `exp` claim + JJWT parser enforces on every request |

---

## 12. Deployment Notes

### Environment Variables

In production, override the default JWT secret:

```bash
export JWT_SECRET=your-256-bit-random-secret-here
```

### application.properties for Production

```properties
spring.datasource.url=jdbc:postgresql://your-db-host:5432/elearning_platform
spring.datasource.username=your-db-user
spring.datasource.password=your-db-password
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
jwt.secret=${JWT_SECRET}
```

### CORS

The allowed origin is `http://localhost:3000` in development. For production, update `SecurityConfig.corsConfigurationSource()`:

```java
config.setAllowedOrigins(List.of("https://your-production-domain.com"));
```

### Frontend Build

```bash
cd frontend
npm run build
# Output: frontend/dist/ — deploy to any static host or serve via Nginx
```

---

*Fold E-Learning Platform — CEF331 Group 12, University of Buea*
*Java 25 · Spring Boot 4.0.6 · Spring Security 6 · PostgreSQL 14 · React 18 · TypeScript 5 · Vite 5*
