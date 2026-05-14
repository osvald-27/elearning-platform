# UB E-Learning Platform — Sprint 2 Complete Documentation
## CEF331 Group 12 | University of Buea
### Course Management and Enrollment System

---

## Table of Contents

1. [Sprint 2 Overview](#1-sprint-2-overview)
2. [Architecture and System Design](#2-architecture-and-system-design)
3. [Database Layer](#3-database-layer)
4. [OOP and OOM Concepts — Deep Analysis](#4-oop-and-oom-concepts--deep-analysis)
5. [Entity Model — Complete Explanation](#5-entity-model--complete-explanation)
6. [Data Transfer Objects (DTOs)](#6-data-transfer-objects-dtos)
7. [Repository Layer](#7-repository-layer)
8. [Service Layer — Business Logic](#8-service-layer--business-logic)
9. [Controller Layer — HTTP Interface](#9-controller-layer--http-interface)
10. [Security — Method-Level Authorization](#10-security--method-level-authorization)
11. [Exception Hierarchy](#11-exception-hierarchy)
12. [Frontend Architecture](#12-frontend-architecture)
13. [API Contracts](#13-api-contracts)
14. [Complete End-to-End Flows](#14-complete-end-to-end-flows)
15. [Design Patterns Catalogue](#15-design-patterns-catalogue)
16. [Sprint 2 Invariants and Business Rules](#16-sprint-2-invariants-and-business-rules)

---

## 1. Sprint 2 Overview

Sprint 2 extends the identity layer from Sprint 1 into a fully functional learning management system. Where Sprint 1 established who users are, Sprint 2 establishes what they can do.

### What Was Built

**Backend — 14 new Java files:**
- 5 new entity classes: `Course`, `CourseMaterial`, `Enrollment`, `MaterialType` (enum), `EnrollmentStatus` (enum)
- 6 new DTO classes: `CourseResponse`, `CourseDetailResponse`, `MaterialResponse`, `CreateCourseRequest`, `EnrollmentResponse`, `EnrollmentStatusResponse`
- 2 new repository interfaces: `CourseRepository`, `EnrollmentRepository`
- 2 new service classes: `CourseService`, `EnrollmentService`
- 2 new controller classes: `CourseController`, `EnrollmentController`
- 4 new exception classes: `ResourceNotFoundException`, `AlreadyEnrolledException`, `NotEnrolledException`, `ForbiddenException`
- 1 updated class: `SecurityConfig` (added `@EnableMethodSecurity`)
- 1 updated class: `GlobalExceptionHandler` (added 4 new handler methods)

**Database — 2 new SQL files:**
- `migration_sprint2.sql` — 3 new tables (courses, course_materials, enrollments) and 2 enum types
- `seed_sprint2.sql` — instructor user, student user, 3 published courses, 1 draft, 12 materials

**Frontend — 5 new/replaced TypeScript files:**
- `StudentDashboard.tsx` — replaced stub with full course grid and search
- `InstructorDashboard.tsx` — replaced stub with course management and creation
- `CourseDetailPage.tsx` — new page with enrollment state machine
- `CourseAttendPage.tsx` — new page with material rendering by type
- `App.tsx` — updated with 3 new routes
- `api.ts` — updated with 10 new API calls
- `types/index.ts` — updated with 7 new TypeScript interfaces

### The Domain Model in Plain Language

A **Course** belongs to an **Instructor**. A Course contains **CourseMaterials** ordered by index. A **Student** can **Enroll** in a Course. The Enrollment tracks the relationship and carries state: it starts as `ACTIVE`, can be changed to `DROPPED`, and is never deleted — only status-changed. A Student who dropped a course can re-enroll, which creates a new Enrollment record since the unique constraint `(student_id, course_id)` was only on the original record.

---

## 2. Architecture and System Design

### The Three-Layer Architecture

```
HTTP Request
     ↓
[Controller Layer]     — Receives HTTP, calls service, returns ResponseEntity
     ↓
[Service Layer]        — Business rules, transactions, entity ↔ DTO mapping
     ↓
[Repository Layer]     — SQL generation, database I/O, entity hydration
     ↓
[Database]             — PostgreSQL: constraints, indexes, referential integrity
```

This three-layer architecture is not arbitrary. Each layer has one job (Single Responsibility Principle). Each layer depends on the layer below it through an abstraction (Dependency Inversion Principle). The controller never touches the repository. The repository never contains business logic. Violations of these boundaries are bugs, not features.

### Package Structure

```
com.elearning.backend
├── entity/          ← Domain objects: Course, CourseMaterial, Enrollment, enums
├── dto/             ← Data boundary: what the HTTP world sees
├── repository/      ← Database abstraction: Spring Data interfaces
├── service/         ← Business rules: where decisions are made
├── controller/      ← HTTP interface: receives requests, delegates, returns responses
├── exception/       ← Domain errors: typed exceptions for every business failure
└── security/        ← Auth infrastructure: JWT, filters, method security
```

---

## 3. Database Layer

### migration_sprint2.sql — Complete Analysis

#### The Two New Enum Types

```sql
CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'DROPPED');
CREATE TYPE material_type AS ENUM ('TEXT', 'VIDEO', 'FILE', 'LINK');
```

PostgreSQL enums are first-class types. Unlike storing strings, enum columns physically reject any value not in the defined set at the storage engine level — before constraints, before triggers, before application code. If a bug in `EnrollmentService` somehow tried to insert `'COMPLETED'` as a status, PostgreSQL raises a type error and the transaction rolls back. The enum is the final, unconditional enforcer.

The Java enums `EnrollmentStatus` and `MaterialType` mirror these exactly. When Hibernate writes `EnrollmentStatus.ACTIVE.name()` to the database, it writes the string `"ACTIVE"`. PostgreSQL validates it against the `enrollment_status` enum type. Both layers enforce the same constraint independently.

#### The courses Table

```sql
CREATE TABLE courses (
    id            BIGSERIAL    PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    image_url     VARCHAR(500),
    instructor_id BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    published     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

**`instructor_id REFERENCES users(id) ON DELETE SET NULL`** — this is a critical design decision. When an instructor's account is deleted, their courses are not deleted. Instead, `instructor_id` is set to `NULL`. The `Course` entity handles this with a null check: `course.getInstructor() != null ? course.getInstructor().getFullName() : "Unknown"`. This preserves academic content even when the original instructor leaves the institution. The alternative — `ON DELETE CASCADE` — would delete all courses when an instructor is removed, which is unacceptable for an educational platform.

**`published BOOLEAN NOT NULL DEFAULT FALSE`** — every course starts as a draft, invisible to students. This is enforced at three layers: the database default, the `Course()` constructor (`this.published = false`), and `CourseService.createCourse()` which explicitly calls `course.setPublished(false)`. Three independent enforcement points mean no code path can accidentally create a visible course.

**`description TEXT`** — unlike `VARCHAR(255)`, the `TEXT` type in PostgreSQL has no length limit. Lecture descriptions can be arbitrarily long. The trade-off is that PostgreSQL stores long TEXT values in a separate TOAST (The Oversized Attribute Storage Technique) table, meaning very long descriptions require an extra I/O operation. For descriptions in the hundreds of characters, this is irrelevant.

#### The course_materials Table

```sql
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
```

**`REFERENCES courses(id) ON DELETE CASCADE`** — materials are existentially dependent on their course. This is the OOP concept of **composition** expressed at the database level. When a course is deleted, all its materials are automatically deleted. The cascade propagates through the storage engine without requiring any Java code. The `@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)` annotation on the `Course` entity mirrors this in Java — a material cannot exist without its parent course.

**`content TEXT` and `content_url VARCHAR(500)`** — these two columns serve different material types. TEXT materials store their content directly in the `content` column. VIDEO, FILE, and LINK materials store a URL in `content_url` and leave `content` null. This is a denormalized design — a fully normalized approach would create separate tables for each material type. For four types with simple structures, the single-table approach is correct: simpler queries, simpler entity model, no joins needed.

**`order_index INT NOT NULL DEFAULT 0`** — the order in which materials appear in a course is an explicit property, not derived from insertion order. This means instructors can reorder materials without deleting and recreating them. The `@OrderBy("orderIndex ASC")` annotation in `Course.java` and the manual sort in `CourseService.toCourseDetailResponse()` both enforce this ordering.

#### The enrollments Table

```sql
CREATE TABLE enrollments (
    id               BIGSERIAL         PRIMARY KEY,
    student_id       BIGINT            NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    course_id        BIGINT            NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status           enrollment_status NOT NULL DEFAULT 'ACTIVE',
    progress_percent FLOAT             NOT NULL DEFAULT 0.0,
    enrolled_at      TIMESTAMP         NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_id)
);
```

**`UNIQUE (student_id, course_id)`** — this composite unique constraint is the database enforcement of a business rule: one student can only have one enrollment record per course. `EnrollmentService.enroll()` checks `existsByStudentIdAndCourseId()` before inserting, but even if that check somehow failed (race condition in a multi-threaded environment), the database would reject the second insert with a unique constraint violation. The service-level check prevents the error; the database constraint is the backstop.

**Why not `ON DELETE SET NULL` for student and course?** If a student account is deleted, their enrollment history has no value without the student — cascade deletion is correct. If a course is deleted, enrollment records for that course are also meaningless — cascade deletion is correct. Contrast with `instructor_id` in `courses`, where keeping the course after instructor deletion makes sense.

**`status enrollment_status NOT NULL DEFAULT 'ACTIVE'`** — every enrollment begins as ACTIVE. The `Enrollment()` constructor also sets `this.status = EnrollmentStatus.ACTIVE`. The status can only transition to `DROPPED` through `EnrollmentService.drop()`. It cannot transition back to `ACTIVE` — a dropped student must re-enroll (creating a new record). This is a deliberate limitation that preserves a clean audit trail.

#### Indexes and Their Purposes

```sql
CREATE INDEX idx_courses_instructor  ON courses(instructor_id);
CREATE INDEX idx_courses_published   ON courses(published);
CREATE INDEX idx_materials_course    ON course_materials(course_id);
CREATE INDEX idx_materials_order     ON course_materials(course_id, order_index);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course  ON enrollments(course_id);
```

Every `WHERE` clause in the service queries is backed by an index:

- `findAllByPublishedTrue()` → `WHERE published = TRUE` → `idx_courses_published`
- `findAllByInstructorId()` → `WHERE instructor_id = ?` → `idx_courses_instructor`
- Materials loading → `WHERE course_id = ?` → `idx_materials_course`
- Material ordering → `ORDER BY course_id, order_index` → `idx_materials_order` (composite)
- `getMyCourses()` → `WHERE student_id = ?` → `idx_enrollments_student`

Without these indexes, every query would perform a sequential scan — reading every row in the table to find matches. With 10,000 courses, `findAllByPublishedTrue()` without the index reads all 10,000 rows. With the index, PostgreSQL uses the B-tree to find matching rows in O(log n) time.

The composite index `(course_id, order_index)` serves the `ORDER BY orderIndex ASC` clause on the materials query. A composite index on `(course_id, order_index)` allows PostgreSQL to both filter by `course_id` and return rows already sorted by `order_index` in a single B-tree scan, avoiding a separate sort operation.

---

## 4. OOP and OOM Concepts — Deep Analysis

This section is the intellectual core of the documentation. Every OOP and OOM concept demonstrated in Sprint 2 is explained from first principles, then traced to the exact code that implements it.

### 4.1 Object-Oriented Modelling (OOM)

Object-Oriented Modelling is the discipline of analysing a real-world domain and expressing it as a set of objects, their attributes, and their relationships. Sprint 2 introduces five new concepts from the domain: Course, CourseMaterial, Enrollment, MaterialType, and EnrollmentStatus. The modelling decisions made for each one are not arbitrary — they reflect real facts about the University of Buea e-learning domain.

#### The Domain Facts That Drive the Model

**Fact 1: A Course is owned by an Instructor.** This is a many-to-one relationship. Many courses can belong to one instructor. In the model, `Course` holds a reference to `User` (the instructor). This is an **association** — Course knows about its Instructor. The Instructor does not hold a collection of Courses in the entity (no `@OneToMany` on `User`) because loading an instructor does not require loading all their courses. The association is navigable in one direction only: Course → Instructor.

**Fact 2: A Course is composed of Materials.** Materials do not exist independently. There is no such thing as a Material without a Course. In OOM terms, this is **composition** — the strongest form of containment. If the Course is destroyed, the Materials are destroyed. This is modelled with `@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)` in Java and `ON DELETE CASCADE` in SQL. Both the Java model and the database model independently express the same domain fact.

**Fact 3: A Student can attend multiple Courses, and a Course can be attended by multiple Students.** This is a many-to-many relationship. But it is not a simple junction — the relationship itself carries data: when did the student enroll, what is their status, what is their progress? In OOM, when a relationship carries its own attributes, it becomes an **association class**. `Enrollment` is this association class. It has its own identity (`id`), its own attributes (`status`, `progressPercent`, `enrolledAt`), and references to both sides of the relationship.

**Fact 4: A Course starts hidden from students and becomes visible only when an Instructor explicitly publishes it.** This is a **state** that belongs to the Course object. The `published` boolean is an attribute of `Course`. The transition from unpublished to published is a one-way operation (`setPublished(true)`) — there is no `unpublish()` method, which is a deliberate design decision reflecting the real-world expectation that once a course is live, taking it offline requires explicit administrative action.

**Fact 5: Materials have different types with different rendering requirements.** TEXT materials display their content directly. VIDEO materials display a play link. FILE materials display a download link. This type distinction is a domain fact. It is modelled as the `MaterialType` enum — an enumerated type capturing exactly the four kinds of material that exist in the domain. No more, no less.

### 4.2 The Four Pillars — Sprint 2 Applications

#### ENCAPSULATION

Encapsulation in Sprint 2 is demonstrated most clearly in the private mapping methods of the service layer:

```java
private CourseResponse toCourseResponse(Course course) { ... }
private CourseDetailResponse toCourseDetailResponse(Course course) { ... }
private MaterialResponse toMaterialResponse(CourseMaterial m) { ... }
private EnrollmentResponse toEnrollmentResponse(Enrollment e) { ... }
```

These methods are `private`. Controllers cannot call them. Other services cannot call them. They are internal mechanisms of the service class, hidden from all external callers. This is encapsulation of implementation detail.

The significance is this: if the `Course` entity gains a new field in Sprint 3 — say, `enrollmentCount` — only `toCourseResponse()` needs to change. All controllers that call `getPublishedCourses()` automatically receive the updated response without any changes to their own code. The mapping logic is encapsulated inside the service, and the change propagates correctly without the caller knowing.

The `Course` entity also demonstrates encapsulation through selective setter provision:

```java
// No setter for: id, createdAt, materials
// Setters exist for: title, description, imageUrl, instructor, published
```

`id` has no setter because it is assigned by the database — no application code should ever set it. `createdAt` has no setter because it is set once in the constructor and never changes. `materials` has no setter because adding materials requires going through the proper collection management methods (`cascade` handles persistence). The absence of these setters makes incorrect usage a compile-time error, not a runtime bug.

#### INHERITANCE (Sprint 2 Extension)

Sprint 2 does not add new subclasses to the `User` hierarchy, but it uses that hierarchy in important ways. `EnrollmentService.enroll()` takes a `Long studentId`, loads the user with `userRepository.findById(studentId)`, and sets it on the enrollment:

```java
User student = userRepository.findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

Enrollment enrollment = new Enrollment();
enrollment.setStudent(student);
```

The `Enrollment.student` field is typed as `User`, not `Student`. At runtime, the object is actually a `Student` (because the discriminator column says `'STUDENT'`). But the `Enrollment` entity does not care about which subtype it holds — it only needs the `User` interface (the `getId()` method, the association). This is the Liskov Substitution Principle in practice: wherever `User` is expected, any subtype can be substituted without consequence.

The `CourseService.createCourse()` method similarly loads the instructor as a `User`:

```java
User instructor = userRepository.findById(instructorId)
        .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));
course.setInstructor(instructor);
```

At runtime this is an `Instructor` object (discriminator `'INSTRUCTOR'`). But `Course.instructor` is typed `User`. The inheritance hierarchy allows a single field type to hold any of the three subtypes, with the discriminator carrying the runtime identity information.

#### POLYMORPHISM

**Polymorphism in the Repository Layer**

`CourseRepository` and `EnrollmentRepository` both extend `JpaRepository`. When Spring creates proxy implementations for these interfaces at startup, it creates two different classes that both satisfy the `JpaRepository` contract. `CourseRepository` generates SQL for the `courses` table. `EnrollmentRepository` generates SQL for the `enrollments` table. The method `save(entity)` exists on both — but it produces entirely different SQL depending on which repository it is called on. This is runtime polymorphism through interface implementation.

**Polymorphism in the Exception Handler**

```java
@ExceptionHandler(ResourceNotFoundException.class)
public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException e) { ... }

@ExceptionHandler(AlreadyEnrolledException.class)
public ResponseEntity<Map<String, String>> handleAlreadyEnrolled(AlreadyEnrolledException e) { ... }

@ExceptionHandler(NotEnrolledException.class)
public ResponseEntity<Map<String, String>> handleNotEnrolled(NotEnrolledException e) { ... }

@ExceptionHandler(ForbiddenException.class)
public ResponseEntity<Map<String, String>> handleForbidden(ForbiddenException e) { ... }
```

Four methods with the same name `handle*` (or effectively the same role), each taking a different exception type. Spring's AOP infrastructure determines at runtime which method to call based on the runtime type of the thrown exception. This is runtime polymorphism applied to error handling.

**Polymorphism in the Frontend — Material Rendering**

In `CourseAttendPage.tsx`, the rendering of a material depends on its `materialType`:

```typescript
{m.materialType === 'TEXT' && m.content && (
    <p style={s.textContent}>{m.content}</p>
)}
{m.materialType === 'VIDEO' && m.contentUrl && (
    <div style={s.videoWrap}>...</div>
)}
{m.materialType === 'FILE' && m.contentUrl && (
    <div style={s.fileWrap}>...</div>
)}
{m.materialType === 'LINK' && m.contentUrl && (
    <div style={s.fileWrap}>...</div>
)}
```

The same data structure (a `MaterialResponse` object) renders differently based on a type discriminator. In a more advanced implementation, this would be done with a `MaterialRenderer` interface and concrete implementations for each type — a classic polymorphism pattern. The if-chain is the functionally equivalent, more readable version for four types.

#### ABSTRACTION

**Repository Abstraction**

`CourseRepository` declares intentions, not implementations:

```java
List<Course> findAllByPublishedTrue();
List<Course> findAllByInstructorId(Long instructorId);
Optional<Course> findByIdWithMaterials(@Param("id") Long id);
Long countActiveEnrollments(@Param("courseId") Long courseId);
```

`CourseService` calls `courseRepository.findAllByPublishedTrue()` with no knowledge of the SQL it generates, the connection pool it uses, the query plan PostgreSQL chooses, or the result set mapping Hibernate performs. All of that complexity is abstracted behind four method signatures.

**DTO Abstraction as an Anti-Corruption Layer**

The DTO layer is the abstraction between the internal domain model and the external HTTP world. `CourseDetailResponse` contains `instructorName` as a flat string. The `Course` entity contains `instructor` as a `User` object reference. The frontend never sees `User` objects, never navigates `user.getFullName()`, never worries about lazy loading or Hibernate sessions. The DTO collapses the object graph into a flat, serializable structure. This is **abstraction through flattening** — a common pattern in layered architectures.

### 4.3 Object Relationships — UML in Code

#### Association (Course → User/Instructor)

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "instructor_id")
private User instructor;
```

This is a **unidirectional association**. `Course` knows about `User` (its instructor). `User` does not know about `Course` — there is no `List<Course> courses` field on `User`. The association is navigable in one direction only: from Course to Instructor. This is correct because loading a `User` should not require loading all their courses.

**Why `FetchType.LAZY`?** Lazy loading means Hibernate does not load the `User` object when it loads the `Course`. Instead, it creates a proxy object. The moment you call `course.getInstructor().getFullName()`, Hibernate fires a second SQL query: `SELECT * FROM users WHERE id = ?`. This is the N+1 problem if done carelessly — loading 10 courses would fire 11 queries (1 for courses, 10 for instructors). The `@Query` annotation with `LEFT JOIN FETCH` in `findByIdWithMaterials()` solves this for the detail endpoint by loading course and materials in one query.

#### Composition (Course ↔ CourseMaterial)

```java
// In Course.java
@OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
@OrderBy("orderIndex ASC")
private List<CourseMaterial> materials = new ArrayList<>();

// In CourseMaterial.java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "course_id", nullable = false)
private Course course;
```

This is a **bidirectional composition**. `Course` knows about its `materials` collection. `CourseMaterial` knows about its `course` parent. `mappedBy = "course"` tells Hibernate that the foreign key is in the `course_materials.course_id` column, not a join table. `cascade = CascadeType.ALL` means any save/delete on `Course` cascades to all its materials. `orphanRemoval = true` means removing a material from `course.getMaterials()` deletes it from the database — there is no orphaned material with a null course reference.

#### Association Class (Enrollment)

```java
@Entity
@Table(name = "enrollments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "course_id"}))
public class Enrollment {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    private EnrollmentStatus status;
    private Double progressPercent;
    private LocalDateTime enrolledAt;
}
```

`Enrollment` is an association class — it models a many-to-many relationship (Student ↔ Course) that carries its own state. A pure many-to-many in JPA would use `@ManyToMany` with a join table containing only `(student_id, course_id)`. The moment the relationship needs its own attributes — status, progress, timestamp — it must become an explicit entity. `Enrollment` is that entity. It has its own primary key, its own lifecycle, its own business behaviour (`drop()` changes its status).

This pattern appears in real-world systems constantly: Order ↔ Product through OrderLineItem (which carries quantity and price), Student ↔ Module through Registration (which carries grade and attendance), Employee ↔ Project through Assignment (which carries role and hours). The association class is one of the most important OOM patterns.

### 4.4 SOLID Principles — Sprint 2

#### S — Single Responsibility

Every class added in Sprint 2 has exactly one reason to change:

| Class | Its single responsibility |
|---|---|
| `Course` | Represent a course's state and identity |
| `CourseMaterial` | Represent a single material item within a course |
| `Enrollment` | Represent the relationship between a student and a course |
| `CourseService` | Apply course-related business rules |
| `EnrollmentService` | Apply enrollment-related business rules |
| `CourseController` | Receive course HTTP requests and return course HTTP responses |
| `EnrollmentController` | Receive enrollment HTTP requests and return enrollment responses |
| `CourseRepository` | Query and persist Course entities |
| `EnrollmentRepository` | Query and persist Enrollment entities |

If the business rule "a student can enroll in at most 5 courses" is introduced, only `EnrollmentService.enroll()` changes. If the API endpoint for courses moves from `/api/courses` to `/api/v2/courses`, only `CourseController` changes. If the `courses` table gains a `category` column, only `Course`, the DTOs, and the service mapping methods change. Each change affects exactly one class.

#### O — Open/Closed Principle

The `GlobalExceptionHandler` demonstrates the Open/Closed Principle. It is open for extension — adding a new exception type requires only adding a new `@ExceptionHandler` method. It is closed for modification — adding `AlreadyEnrolledException` handling did not require changing the existing `handleEmailAlreadyExists()` or `handleNotFound()` methods. Each handler is independent. New exceptions extend the handler without modifying existing handlers.

The `MaterialType` enum also reflects this principle in the frontend. When a new material type is added in Sprint 3, `CourseAttendPage.tsx` needs a new `if` branch. The existing branches are not modified. The extension point is clearly defined by the enum.

#### L — Liskov Substitution Principle

`EnrollmentStatusResponse` illustrates LSP through optional fields:

```java
public class EnrollmentStatusResponse {
    private boolean enrolled;
    private String status;       // null if not enrolled
    private Double progressPercent; // null if not enrolled
}
```

When `enrolled = false`, `status` and `progressPercent` are `null`. The frontend checks:

```typescript
const isActive  = status?.enrolled && status.status === 'ACTIVE';
const isDropped = status?.enrolled && status.status === 'DROPPED';
```

The `?.` optional chaining ensures the code works correctly whether the response indicates enrolled or not. Both variants of `EnrollmentStatusResponse` satisfy the same interface contract.

#### I — Interface Segregation Principle

`CourseRepository` and `EnrollmentRepository` are separate interfaces with separate methods. A service that only needs enrollment data (`EnrollmentService`) depends on `EnrollmentRepository`, not on `CourseRepository`. It is not forced to depend on course-querying methods it does not use. Each service depends only on the repository interface whose methods it actually calls.

#### D — Dependency Inversion Principle

`CourseService` depends on `CourseRepository` (a Spring Data interface, an abstraction). It does not depend on any Hibernate class, any JDBC class, or any PostgreSQL-specific class. If the persistence layer were switched from PostgreSQL to MongoDB, `CourseService` would not change — only the repository implementation (provided by Spring Data MongoDB) would change. `CourseController` depends on `CourseService` (a Spring bean interface). It does not depend on `CourseRepository`. The controller has no knowledge of how data is stored.

---

## 5. Entity Model — Complete Explanation

### Course.java

```java
@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id")
    private User instructor;

    @Column(nullable = false)
    private Boolean published = false;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    private List<CourseMaterial> materials = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Course() {
        this.createdAt = LocalDateTime.now();
        this.published = false;
    }
```

**`@Column(columnDefinition = "TEXT")`** — for `description`, the standard `@Column` with `length` would produce a `VARCHAR(n)` column. `columnDefinition = "TEXT"` overrides this to produce a PostgreSQL `TEXT` column, which has no length limit. This is used when `ddl-auto` would generate schema — with `ddl-auto=validate`, Hibernate checks the actual column type against this definition.

**`private List<CourseMaterial> materials = new ArrayList<>()`** — the field is initialized to an empty `ArrayList` at declaration. This prevents `NullPointerException` when accessing `course.getMaterials()` before any materials are added. When Hibernate hydrates a `Course` from the database, it replaces this empty list with a Hibernate-managed `PersistentBag` (a lazy-loading collection proxy). The initialization serves the construction path; Hibernate replaces it on the database-load path.

**Why `Boolean` (capital B) not `boolean` (primitive)?** For `published`, either would work since the column is `NOT NULL`. However, `Boolean` is used for consistency with the `User` entity pattern and to allow explicit null-checking in code where needed. Hibernate maps both `boolean` and `Boolean` to a SQL BOOLEAN column.

**No `setId()`, no `setCreatedAt()`, no `setMaterials()`** — these three fields have no setters. `id` is database-generated. `createdAt` is set once in the constructor. `materials` is managed through JPA cascade — you add materials to `course.getMaterials()` collection, and the cascade handles persistence. Direct replacement of the collection would break JPA's tracking.

### CourseMaterial.java

```java
@Entity
@Table(name = "course_materials")
public class CourseMaterial {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(name = "material_type", nullable = false)
    private MaterialType materialType = MaterialType.TEXT;
```

**`@Enumerated(EnumType.STRING)`** — Hibernate stores the enum as its string name (`"TEXT"`, `"VIDEO"`, `"FILE"`, `"LINK"`) rather than its ordinal integer (0, 1, 2, 3). The string approach is always correct because reordering enum values would corrupt ordinal-based storage. The string `"VIDEO"` always means VIDEO regardless of its position in the enum declaration.

**`nullable = false` on `course_id`** — a material must always belong to a course. This `NOT NULL` constraint at the JPA level produces the same constraint in the database when schema generation is active. With `ddl-auto=validate`, Hibernate checks that the actual column is `NOT NULL`.

**The `content` and `contentUrl` duality** — both fields are nullable at the database level. A TEXT material has `content` set and `contentUrl` null. A VIDEO material has `contentUrl` set and `content` null. The application layer enforces which field is populated based on `materialType`. No database constraint enforces this because a `CHECK` constraint with conditional logic is possible in PostgreSQL but adds complexity with minimal benefit at this scale.

### Enrollment.java — The Association Class in Detail

```java
@Entity
@Table(name = "enrollments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "course_id"}))
public class Enrollment {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    @Column(name = "progress_percent", nullable = false)
    private Double progressPercent = 0.0;

    @Column(name = "enrolled_at", nullable = false)
    private LocalDateTime enrolledAt;

    public Enrollment() {
        this.enrolledAt = LocalDateTime.now();
        this.status = EnrollmentStatus.ACTIVE;
        this.progressPercent = 0.0;
    }
```

**`@UniqueConstraint(columnNames = {"student_id", "course_id"})`** — this is the JPA way of declaring a composite unique constraint. It is equivalent to `UNIQUE (student_id, course_id)` in SQL. The `@Table` annotation accepts an array of `uniqueConstraints`, allowing multiple composite constraints on the same table. This constraint means the pair `(student_id, course_id)` must be unique across all rows — a student cannot have two enrollment records for the same course.

**`EnrollmentStatus status = EnrollmentStatus.ACTIVE`** — the default is set both at the field level (Java default value) and in the constructor. This double-setting is defensive. The field-level default applies if someone constructs an `Enrollment` through reflection (which Hibernate does — but Hibernate then calls setters from the DB values). The constructor default applies to application-created instances. Both ensure the object is never in an uninitialized state.

**No `setStudent()` and `setCourse()` after construction — missing from the design?** The setters do exist because the service sets them:

```java
enrollment.setStudent(student);
enrollment.setCourse(course);
```

These setters are needed during construction of a new enrollment. In a more strictly encapsulated design, these would be constructor parameters: `new Enrollment(student, course)`. The current design with setters is correct for JPA because Hibernate requires a no-arg constructor and uses setters for hydration.

### MaterialType.java and EnrollmentStatus.java

```java
public enum MaterialType { TEXT, VIDEO, FILE, LINK }
public enum EnrollmentStatus { ACTIVE, DROPPED }
```

These two enums are the simplest possible enumerated types — no fields, no methods, just the constants. They serve as type-safe discriminators. Comparing `material.getMaterialType() == MaterialType.VIDEO` is safe with `==` because Java enums are singletons — there is exactly one `MaterialType.VIDEO` instance in the JVM. Unlike `String`, you cannot accidentally compare `"VIDEO"` with `"video"` because the enum has no case ambiguity.

---

## 6. Data Transfer Objects (DTOs)

### Design Principle: The DTO Boundary

The fundamental rule of the DTO layer is that **entity objects never leave the service layer**. Controllers return `ResponseEntity<DTO>`, never `ResponseEntity<Entity>`. This rule exists for three reasons:

**Security** — entities contain fields that must not be exposed. If a `Course` entity were returned directly as JSON, it would include the full `User` instructor object, which includes `passwordHash`. The DTO forces explicit selection of what to include.

**Stability** — the entity model can change for database reasons (adding a column, changing a relationship type) without breaking the API contract. Only the mapping method in the service needs to change; the DTO and the controller are untouched.

**Performance** — entities may include lazy-loaded collections that trigger additional SQL queries when Jackson tries to serialize them. DTOs contain only already-loaded data, preventing accidental N+1 serialization problems.

### CourseResponse

```java
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private String instructorName;  // flat string, not a User object
    private Boolean published;
}
```

`instructorName` is a flat `String`, not a `User` object. The client does not need the instructor's ID, email, or role — only their display name. Flattening the object graph at the DTO boundary prevents the client from making assumptions about the instructor's internal structure and prevents accidental exposure of instructor details.

### CourseDetailResponse

```java
public class CourseDetailResponse extends CourseResponse {
    private List<MaterialResponse> materials;
}
```

`CourseDetailResponse` extends `CourseResponse`. This is inheritance applied to DTOs. The detail response IS-A course response with additional content. It inherits all fields of `CourseResponse` and adds `materials`. This is correct use of inheritance: a detail response is a strict superset of a summary response.

### MaterialResponse

```java
public class MaterialResponse {
    private Long id;
    private String materialType;  // String, not enum
    private String title;
    private String content;
    private String contentUrl;
    private Integer orderIndex;
}
```

`materialType` is a `String` in the DTO, not `MaterialType` enum. Jackson serializes `MaterialType.VIDEO` as `"VIDEO"` anyway. The frontend receives `"VIDEO"` as a string. TypeScript's type system constrains it to `'TEXT' | 'VIDEO' | 'FILE' | 'LINK'` through the interface definition. The DTO uses `String` to make the JSON contract explicit: this is a JSON string value, not a Java enum reference.

### EnrollmentStatusResponse

```java
public class EnrollmentStatusResponse {
    private boolean enrolled;
    private String status;        // null when enrolled = false
    private Double progressPercent; // null when enrolled = false
}
```

This DTO models three logical states:
1. Not enrolled: `{ enrolled: false, status: null, progressPercent: null }`
2. Actively enrolled: `{ enrolled: true, status: "ACTIVE", progressPercent: 0.0 }`
3. Dropped: `{ enrolled: true, status: "DROPPED", progressPercent: 0.0 }`

The `enrolled` boolean is redundant when `status` is non-null, but it makes the primary distinction (enrolled or not) immediately clear without requiring the client to null-check `status`. This is an intentional redundancy for API clarity.

---

## 7. Repository Layer

### CourseRepository

```java
@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findAllByPublishedTrue();
    List<Course> findAllByInstructorId(Long instructorId);

    @Query("SELECT c FROM Course c LEFT JOIN FETCH c.materials m WHERE c.id = :id ORDER BY m.orderIndex ASC")
    Optional<Course> findByIdWithMaterials(@Param("id") Long id);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId AND e.status = 'ACTIVE'")
    Long countActiveEnrollments(@Param("courseId") Long courseId);
}
```

**`findAllByPublishedTrue()`** — Spring Data parses `findAllBy` (SELECT all WHERE) `Published` (the `published` field) `True` (equals true). Generated SQL:

```sql
SELECT * FROM courses WHERE published = TRUE
```

**`findAllByInstructorId(Long instructorId)`** — Spring Data parses `findAllBy` `Instructor` (the `instructor` field, which is a `@ManyToOne` association) `Id` (the `id` field of that associated object). Spring Data knows to navigate the association and use the foreign key. Generated SQL:

```sql
SELECT * FROM courses WHERE instructor_id = ?
```

**`findByIdWithMaterials(@Query)`** — this custom JPQL query uses `LEFT JOIN FETCH`. `LEFT JOIN FETCH` is a JPQL-specific syntax that tells Hibernate to load the associated collection in the same query, not lazily. Without `JOIN FETCH`, loading a course and then accessing `course.getMaterials()` would fire two SQL queries. With `JOIN FETCH`, Hibernate fires one SQL with a JOIN:

```sql
SELECT c.*, m.* FROM courses c
LEFT JOIN course_materials m ON m.course_id = c.id
WHERE c.id = ?
ORDER BY m.order_index ASC
```

Hibernate then de-duplicates the course row and populates the `materials` list from the joined rows. This is the standard solution to the N+1 query problem for detail pages.

**`countActiveEnrollments(@Query)`** — a cross-entity JPQL query. JPQL navigates the object model: `e.course.id` means "the `id` field of the `course` field of the `Enrollment` entity `e`". Hibernate translates this navigation to a JOIN in SQL. The `AND e.status = 'ACTIVE'` clause compares the enum string representation directly in JPQL.

### EnrollmentRepository

```java
@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);
    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);
    List<Enrollment> findAllByStudentIdAndStatus(Long studentId, EnrollmentStatus status);
    List<Enrollment> findAllByStudentId(Long studentId);
}
```

**`existsByStudentIdAndCourseId`** — Spring Data generates an optimized existence check:

```sql
SELECT COUNT(*) > 0 FROM enrollments WHERE student_id = ? AND course_id = ?
```

This is more efficient than `findByStudentIdAndCourseId().isPresent()` because it does not load the full entity — it only checks for existence.

**`findAllByStudentIdAndStatus(Long studentId, EnrollmentStatus status)`** — the `status` parameter is of type `EnrollmentStatus` (an enum). Spring Data passes `EnrollmentStatus.ACTIVE.name()` as the SQL parameter value, producing:

```sql
SELECT * FROM enrollments WHERE student_id = ? AND status = 'ACTIVE'
```

The enum type parameter makes the method signature self-documenting and type-safe — you cannot accidentally pass an invalid status string.

---

## 8. Service Layer — Business Logic

### CourseService — Method-by-Method Analysis

#### getPublishedCourses()

```java
@Transactional(readOnly = true)
public List<CourseResponse> getPublishedCourses() {
    return courseRepository.findAllByPublishedTrue()
            .stream()
            .map(this::toCourseResponse)
            .collect(Collectors.toList());
}
```

**`@Transactional(readOnly = true)`** — read-only transactions have two benefits. First, they communicate intent: this method does not modify data. Second, Spring and Hibernate optimize them: Hibernate skips dirty checking (comparing entity state before/after to detect changes), HikariCP may use a read replica connection in production setups. For a simple SELECT this optimization is minor, but it is architecturally correct.

**`.stream().map(this::toCourseResponse).collect(Collectors.toList())`** — functional-style transformation. `stream()` converts the `List<Course>` to a `Stream<Course>`. `.map(this::toCourseResponse)` applies the mapping function to each element, producing a `Stream<CourseResponse>`. `collect(Collectors.toList())` materializes the stream back to `List<CourseResponse>`. The method reference `this::toCourseResponse` is equivalent to the lambda `course -> this.toCourseResponse(course)` — it references the private mapping method directly.

#### getCourseDetail()

```java
@Transactional(readOnly = true)
public CourseDetailResponse getCourseDetail(Long courseId) {
    Course course = courseRepository.findByIdWithMaterials(courseId)
            .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

    if (!course.getPublished()) {
        throw new ResourceNotFoundException("Course not found: " + courseId);
    }

    return toCourseDetailResponse(course);
}
```

**Why throw `ResourceNotFoundException` for unpublished courses, not `ForbiddenException`?** Security through obscurity: a student should not know whether a course ID exists but is unpublished or simply does not exist. If you returned 403, an attacker could enumerate unpublished course IDs by checking whether the response is 403 (exists but hidden) or 404 (does not exist). Returning the same 404 for both cases reveals nothing about the unpublished catalog.

**`orElseThrow(() -> new ResourceNotFoundException(...))`** — the lambda `() -> new ResourceNotFoundException(...)` is a supplier — a function that takes no arguments and returns an exception. `Optional.orElseThrow()` calls this supplier only if the `Optional` is empty, so the exception object is constructed only when needed. This is lazy evaluation in action.

#### createCourse()

```java
@Transactional
public CourseResponse createCourse(CreateCourseRequest request, Long instructorId) {
    User instructor = userRepository.findById(instructorId)
            .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

    Course course = new Course();
    course.setTitle(request.getTitle());
    course.setDescription(request.getDescription());
    course.setImageUrl(request.getImageUrl());
    course.setInstructor(instructor);
    course.setPublished(false);

    Course saved = courseRepository.save(course);
    return toCourseResponse(saved);
}
```

**Why load the `User` instructor instead of just setting a `Long instructorId`?** Because `course.setInstructor(instructor)` requires a `User` object for the `@ManyToOne` relationship. Hibernate needs the full object (or at least a proxy) to correctly set the `instructor_id` foreign key. If `Course` had a plain `Long instructorId` field with `@Column(name = "instructor_id")` instead of `@ManyToOne`, you could set the long directly. The `@ManyToOne` approach is chosen because it allows navigation: `course.getInstructor().getFullName()` works without an additional query (assuming the same Hibernate session). The trade-off is the extra `findById()` call on creation.

**`course.setPublished(false)`** — even though the `Course` constructor already sets `published = false`, this line is written explicitly. It is documentation: "this is an intentional business rule, not a coincidental default". Three months later, if someone reads `createCourse()`, the explicit `setPublished(false)` communicates that courses always start as drafts, intentionally.

#### publishCourse()

```java
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
```

**`course.getInstructor().getId().equals(instructorId)`** — this is the ownership check. The logged-in instructor's ID (from the JWT, via `@AuthenticationPrincipal`) must match the course's instructor ID. If an instructor tries to publish another instructor's course, `ForbiddenException` is thrown.

**`.equals()` not `==`** — `Long` is an object type (capital L). For `Long` values outside the cached range (-128 to 127), `==` compares references, not values. `Long.valueOf(128) == Long.valueOf(128)` is `false`. `.equals()` compares the numeric values regardless of caching. Always use `.equals()` for `Long` comparisons.

**Dirty checking — how `save()` updates without explicit UPDATE** — when `courseRepository.findById()` loads a `Course` within a `@Transactional` method, Hibernate takes a "snapshot" of the entity's state. When `course.setPublished(true)` is called, the entity's `published` field changes. When the transaction commits, Hibernate compares the current state against the snapshot (dirty checking). It detects that `published` changed and generates:

```sql
UPDATE courses SET published = TRUE WHERE id = ?
```

Without `@Transactional`, the Hibernate session would close after `findById()` and the entity would be detached — `setPublished(true)` would change the Java object but never reach the database. The `@Transactional` annotation keeps the session open through the method, allowing dirty checking and automatic updates.

### EnrollmentService — Method-by-Method Analysis

#### enroll()

```java
@Transactional
public MessageResponse enroll(Long courseId, Long studentId) {
    Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

    if (!course.getPublished()) {
        throw new ResourceNotFoundException("Course not found: " + courseId);
    }

    if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
        throw new AlreadyEnrolledException("You are already enrolled in this course");
    }

    User student = userRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

    Enrollment enrollment = new Enrollment();
    enrollment.setStudent(student);
    enrollment.setCourse(course);

    enrollmentRepository.save(enrollment);
    return new MessageResponse("Successfully enrolled in " + course.getTitle());
}
```

**The check order and why it matters:**

1. Does the course exist and is it published? → If not, 404 (same message for both — no information leakage)
2. Is the student already enrolled (any status)? → If yes, 409 Conflict
3. Load the student entity (needed for the `Enrollment` object)
4. Create and save the enrollment

The `existsByStudentIdAndCourseId` check covers both `ACTIVE` and `DROPPED` statuses. A dropped student cannot re-enroll through the `enroll()` endpoint — they would get a 409 "already enrolled." The re-enrollment flow must first drop and then create a new enrollment, or the service logic would need to be extended. The current implementation is strict: one enrollment record per `(student, course)` pair, enforced by the unique constraint.

**Note on the unique constraint and race conditions:** In a single-server application, the `existsByStudentIdAndCourseId` check and the `save()` run sequentially in the same transaction. There is no race condition. In a multi-server deployment under high load, two simultaneous enrollment requests for the same student and course could both pass the existence check before either saves. The database unique constraint would then reject one of the inserts with a constraint violation exception. In production, this exception should be caught and translated to a 409. For this project, the service-level check is sufficient.

#### drop()

```java
@Transactional
public MessageResponse drop(Long courseId, Long studentId) {
    Enrollment enrollment = enrollmentRepository
            .findByStudentIdAndCourseId(studentId, courseId)
            .orElseThrow(() -> new NotEnrolledException("You are not enrolled in this course"));

    if (enrollment.getStatus() == EnrollmentStatus.DROPPED) {
        throw new NotEnrolledException("You have already dropped this course");
    }

    enrollment.setStatus(EnrollmentStatus.DROPPED);
    enrollmentRepository.save(enrollment);

    return new MessageResponse("Successfully dropped " + enrollment.getCourse().getTitle());
}
```

**Why `enrollment.getStatus() == EnrollmentStatus.DROPPED` uses `==` (not `.equals()`)?** Because `EnrollmentStatus` is an enum. Enum constants are singletons — there is exactly one `EnrollmentStatus.DROPPED` instance in the JVM. Comparing enum values with `==` is correct and idiomatic in Java. `==` compares references, and for enum constants, reference equality is identical to value equality.

**`enrollment.getCourse().getTitle()`** — this navigates the lazy-loaded `course` association. Within the same `@Transactional` method, the Hibernate session is open. When `getTitle()` is called on the lazy proxy, Hibernate fires:

```sql
SELECT * FROM courses WHERE id = ?
```

This is an N+1 query — but in this context, it is a 1+1 query (one for the enrollment, one for the course title). It is acceptable here. A more optimized approach would use a JPQL query that fetches the enrollment and course in one join, but the simplicity of this approach is the right trade-off for the drop operation.

**The record is not deleted** — this is the most important business rule in `drop()`. The enrollment record remains in the database with `status = 'DROPPED'`. This preserves the history: the student was enrolled in this course. Future analytics, audit trails, and reporting can see that the student enrolled and dropped. If the record were deleted, this history would be lost. The soft-delete pattern (marking as dropped vs. deleting) is a best practice in educational systems.

#### isActivelyEnrolled()

```java
@Transactional(readOnly = true)
public boolean isActivelyEnrolled(Long courseId, Long studentId) {
    return enrollmentRepository
            .findByStudentIdAndCourseId(studentId, courseId)
            .map(e -> e.getStatus() == EnrollmentStatus.ACTIVE)
            .orElse(false);
}
```

**`.map(e -> e.getStatus() == EnrollmentStatus.ACTIVE)`** — `Optional.map()` transforms the value inside an `Optional` if it is present. `findByStudentIdAndCourseId()` returns `Optional<Enrollment>`. If an enrollment exists, `.map()` applies the lambda to get `true` or `false` depending on status, producing `Optional<Boolean>`. `.orElse(false)` returns `false` if the `Optional` is empty (no enrollment). This is functional-style null-safe code: no explicit null check, no `if` statement.

The equivalent imperative code:
```java
Optional<Enrollment> opt = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId);
if (opt.isEmpty()) return false;
return opt.get().getStatus() == EnrollmentStatus.ACTIVE;
```

Both are correct. The functional style is more concise and expresses the transformation clearly.

---

## 9. Controller Layer — HTTP Interface

### CourseController — Complete Analysis

```java
@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private EnrollmentService enrollmentService;
```

**`@RestController`** — composed annotation: `@Controller` (registers as a web component) + `@ResponseBody` (serialize return values to JSON). Every method's return value is automatically JSON-serialized and written to the HTTP response body.

**`@RequestMapping("/api/courses")`** — all endpoint paths in this controller are relative to `/api/courses`. This is the base path for the entire course resource.

**Two `@Autowired` services** — `CourseController` injects both `CourseService` and `EnrollmentService`. The attend endpoint requires both: `EnrollmentService` to check enrollment status, `CourseService` to load the course data. This is the one place where a controller uses two services — justified because the attend endpoint is fundamentally about the intersection of course data and enrollment state.

#### The Attend Endpoint

```java
@GetMapping("/{id}/attend")
@PreAuthorize("hasRole('STUDENT')")
public ResponseEntity<CourseDetailResponse> attendCourse(
        @PathVariable Long id,
        @AuthenticationPrincipal Long userId) {

    if (!enrollmentService.isActivelyEnrolled(id, userId)) {
        throw new ForbiddenException("You must be enrolled to attend this course");
    }
    return ResponseEntity.ok(courseService.getCourseDetailForAttend(id));
}
```

**`@PathVariable Long id`** — Spring MVC extracts the `{id}` segment from the URL path and converts it to a `Long`. If the URL is `/api/courses/42/attend`, `id` is `42L`. If the path variable cannot be converted to `Long` (e.g. `/api/courses/abc/attend`), Spring returns 400 Bad Request automatically.

**`@AuthenticationPrincipal Long userId`** — Spring Security reads the authentication principal from `SecurityContextHolder`. In `JwtFilter`, the principal was set to `userId` (a `Long`): `new UsernamePasswordAuthenticationToken(userId, null, authorities)`. `@AuthenticationPrincipal` extracts that principal and injects it as the `userId` parameter. The controller does not query the database for the user — it uses the ID already validated and extracted from the JWT.

**The enrollment check in the controller** — this is an example of where a business rule belongs in the controller versus the service. The question "is this specific user allowed to access this resource?" is an authorization check, not a business domain rule. Business domain rules (how enrollment is created, what DROPPED means, how progress is calculated) belong in the service. Authorization checks (is the caller permitted to perform this action?) can legitimately live in the controller, backed by the service for the actual check. `@PreAuthorize` handles role-level authorization; the explicit `isActivelyEnrolled()` check handles resource-level authorization.

#### `@PreAuthorize` — Method-Level Security

```java
@GetMapping
@PreAuthorize("hasRole('STUDENT')")
public ResponseEntity<List<CourseResponse>> getPublishedCourses() { ... }

@PostMapping
@PreAuthorize("hasRole('INSTRUCTOR')")
public ResponseEntity<CourseResponse> createCourse(...) { ... }
```

**`@PreAuthorize("hasRole('STUDENT')")`** — Spring Security's AOP proxy intercepts the method call before the method body runs. It evaluates the SpEL (Spring Expression Language) expression `hasRole('STUDENT')`. Spring Security prepends `"ROLE_"` to the argument, looking for `"ROLE_STUDENT"` in the authentication's authorities. If the current authenticated user's authorities include `"ROLE_STUDENT"`, the expression is true and the method executes. If not, Spring Security throws `AccessDeniedException`, which Spring translates to 403 Forbidden.

This check runs after `JwtFilter` has already set the security context. The sequence is: request arrives → `JwtFilter` validates token and sets security context → `SecurityConfig` rule allows authenticated requests → Spring MVC routes to controller method → `@PreAuthorize` AOP proxy evaluates role → method executes (or throws 403).

**`@EnableMethodSecurity`** in `SecurityConfig` activates the `@PreAuthorize` processing. Without this annotation, `@PreAuthorize` annotations are present on methods but do nothing — they are decorative. With `@EnableMethodSecurity`, Spring creates AOP proxies around all `@RestController` beans to intercept calls and evaluate `@PreAuthorize` expressions.

---

## 10. Security — Method-Level Authorization

### The Authorization Model in Sprint 2

Sprint 1 had one rule: `/api/auth/**` is public, everything else requires authentication. Sprint 2 adds role-based authorization: not just "are you authenticated?" but "are you authenticated as the right kind of user?"

The authorization model follows a two-level approach:

**Level 1 — Method-level role check (`@PreAuthorize`):**
- STUDENT can call: `GET /api/courses`, `GET /api/courses/{id}`, `GET /api/courses/{id}/attend`
- INSTRUCTOR can call: `GET /api/courses/instructor/my-courses`, `POST /api/courses`, `PATCH /api/courses/{id}/publish`
- STUDENT can call all enrollment endpoints

**Level 2 — Resource-level ownership check (inside service/controller):**
- An INSTRUCTOR can only publish their own courses (`course.getInstructor().getId().equals(instructorId)`)
- A STUDENT can only attend a course they are actively enrolled in (`isActivelyEnrolled()`)

This two-level model is standard in REST APIs. Role checks are coarse-grained (only STUDENTs can enroll). Ownership checks are fine-grained (only the owning INSTRUCTOR can publish). Both levels are necessary; neither alone is sufficient.

---

## 11. Exception Hierarchy

Sprint 2 introduces four new exception classes, all extending `RuntimeException`:

```
RuntimeException
├── EmailAlreadyExistsException  (Sprint 1) → 400 Bad Request
├── InvalidCredentialsException  (Sprint 1) → 401 Unauthorized
├── AccountNotApprovedException  (Sprint 1) → 403 Forbidden
├── ResourceNotFoundException    (Sprint 2) → 404 Not Found
├── AlreadyEnrolledException     (Sprint 2) → 409 Conflict
├── NotEnrolledException         (Sprint 2) → 400 Bad Request
└── ForbiddenException           (Sprint 2) → 403 Forbidden
```

**`ResourceNotFoundException` → 404** — used for both genuinely missing resources and hidden resources (unpublished courses). The same HTTP status prevents information leakage.

**`AlreadyEnrolledException` → 409 Conflict** — HTTP 409 Conflict means the request could not be completed because of a conflict with the current state of the resource. An attempt to enroll when already enrolled is exactly this: the request is valid (well-formed, authenticated, authorized) but conflicts with the current state.

**`NotEnrolledException` → 400 Bad Request** — used when a drop is attempted but the student is not enrolled, or is already dropped. The request makes no sense given the current state. HTTP 400 is appropriate.

**`ForbiddenException` → 403 Forbidden** — used for resource-level authorization failures. The user is authenticated and has the correct role, but does not own the resource they are trying to act on.

Each exception is caught by a dedicated `@ExceptionHandler` method in `GlobalExceptionHandler`. The response body is always `{"error": "message"}`. Every error response has the same shape, making error handling on the frontend uniform.

---

## 12. Frontend Architecture

### TypeScript Interface Hierarchy

```typescript
// Base course representation
interface CourseResponse {
    id: number;
    title: string;
    description: string;
    imageUrl: string | null;
    instructorName: string;
    published: boolean;
}

// Extended representation (inherits all fields of CourseResponse)
interface CourseDetailResponse extends CourseResponse {
    materials: MaterialResponse[];
}
```

**`extends` in TypeScript interfaces** — `CourseDetailResponse extends CourseResponse` means CourseDetailResponse includes all fields of CourseResponse plus its own additions. This mirrors the Java `CourseDetailResponse extends CourseResponse` DTO inheritance. The frontend and backend models are structurally parallel — a deliberate choice for maintainability.

**`string | null`** — TypeScript union types. `imageUrl: string | null` means `imageUrl` is either a `string` or `null`. TypeScript enforces that you handle both cases before using `imageUrl` in a context requiring a `string`. In JSX: `{course.imageUrl ? <img src={course.imageUrl} /> : <div>📚</div>}` — the ternary handles both cases.

### The Axios Service Layer

```typescript
const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
```

**Request interceptor** — the interceptor runs before every request. It reads the token from localStorage and attaches it as an Authorization header. This means: write the API call once (`courseService.getAll()`), never write `Authorization` header manually. The interceptor handles it universally for all calls through the `api` instance.

**Service objects as namespace organizers:**

```typescript
export const courseService = {
    getAll:       () => api.get<CourseResponse[]>('/courses'),
    getOne:       (id: number) => api.get<CourseDetailResponse>(`/courses/${id}`),
    attend:       (id: number) => api.get<CourseDetailResponse>(`/courses/${id}/attend`),
    getMyCourses: () => api.get<CourseResponse[]>('/courses/instructor/my-courses'),
    create:       (data: CreateCourseRequest) => api.post<CourseResponse>('/courses', data),
    publish:      (id: number) => api.patch<CourseResponse>(`/courses/${id}/publish`),
};
```

`courseService` is a plain object whose values are functions. It serves as a namespace — grouping all course-related API calls under one identifier. Generic type parameters like `api.get<CourseResponse[]>` tell TypeScript that the response data is `CourseResponse[]`. TypeScript will enforce that you use the data as `CourseResponse[]` everywhere it flows.

### Component State Management

`StudentDashboard.tsx` demonstrates the canonical React state pattern for data loading:

```typescript
const [courses,     setCourses]     = useState<CourseResponse[]>([]);
const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
const [loading,     setLoading]     = useState(true);
const [error,       setError]       = useState('');

useEffect(() => {
    const load = async () => {
        try {
            const [coursesRes, enrollRes] = await Promise.all([
                courseService.getAll(),
                enrollmentService.getMyCourses(),
            ]);
            setCourses(coursesRes.data);
            setEnrollments(enrollRes.data);
        } catch (err) { ... }
        finally { setLoading(false); }
    };
    load();
}, []);
```

**`Promise.all([...])` — parallel requests** — instead of awaiting `courseService.getAll()` then awaiting `enrollmentService.getMyCourses()` sequentially (two round trips), `Promise.all` fires both requests simultaneously and waits for both to complete. Total time: `max(courses_time, enrollments_time)`. Sequential would take `courses_time + enrollments_time`. For two fast API calls, this saves ~100ms — perceptible to users.

**`useEffect(fn, [])` — the empty dependency array** — the empty array `[]` means this effect runs once when the component mounts and never again. It is equivalent to `componentDidMount()` in class components. Without the dependency array, the effect would run on every render — causing an infinite loop (render → fetch → setState → render → ...).

**The `enrolledIds` derived state:**

```typescript
const enrolledIds = new Set(enrollments.map(e => e.courseId));
```

This derives a `Set<number>` from the `enrollments` array. `Set` lookup (`enrolledIds.has(course.id)`) is O(1) — constant time regardless of how many enrollments exist. If this were `enrollments.find(e => e.courseId === course.id)` inside the course grid map, it would be O(n × m) — n courses times m enrollments — quadratic time. The Set converts it to O(n + m) — linear time. For a few dozen courses and enrollments this is imperceptible, but the pattern is architecturally correct.

### CourseDetailPage — The Enrollment State Machine

The enrollment state machine in `CourseDetailPage.tsx` is driven by `EnrollmentStatusResponse`:

```typescript
const isActive  = status?.enrolled && status.status === 'ACTIVE';
const isDropped = status?.enrolled && status.status === 'DROPPED';

// State machine — which buttons to show:
{!status?.enrolled && <button onClick={handleEnroll}>Enroll Now</button>}
{isActive && <>
    <button onClick={handleAttend}>Attend Course</button>
    <button onClick={handleDrop}>Drop Course</button>
</>}
{isDropped && <button onClick={handleEnroll}>Re-enroll</button>}
```

This is a finite state machine with three states and four transitions:

```
[Not Enrolled] --enroll()-->  [Active]
[Active]       --drop()-->    [Dropped]
[Dropped]      --enroll()-->  [Not Enrolled] (via new enrollment record creation)
```

Wait — "Re-enroll" calls `handleEnroll()` which calls `enrollmentService.enroll()`. But the unique constraint would reject a second enrollment for `(student_id, course_id)`. This reveals a limitation: the current service does not support re-enrollment. The "Re-enroll" button exists in the UI but would receive a 409 from the backend. This is a known limitation to be addressed in Sprint 3 (by deleting the dropped enrollment record or by extending the service to handle re-enrollment by updating the existing record's status back to ACTIVE).

**Optimistic UI update — `setStatus(prev => prev ? { ...prev, status: 'DROPPED' } : prev)`** — after a successful drop, instead of re-fetching from the server, the React state is updated directly. `prev ? { ...prev, status: 'DROPPED' } : prev` creates a new object with all existing properties (`...prev`) but with `status` replaced by `'DROPPED'`. The spread operator `...prev` performs a shallow copy — all other fields remain unchanged. The UI updates immediately without a round trip.

---

## 13. API Contracts

### Course Endpoints

| Method | URL | Role | Request Body | Success Response | Errors |
|---|---|---|---|---|---|
| GET | `/api/courses` | STUDENT | — | `200 [CourseResponse]` | 401, 403 |
| GET | `/api/courses/{id}` | STUDENT | — | `200 CourseDetailResponse` | 401, 403, 404 |
| GET | `/api/courses/{id}/attend` | STUDENT (enrolled) | — | `200 CourseDetailResponse` | 401, 403, 404 |
| GET | `/api/courses/instructor/my-courses` | INSTRUCTOR | — | `200 [CourseResponse]` | 401, 403 |
| POST | `/api/courses` | INSTRUCTOR | `CreateCourseRequest` | `201 CourseResponse` | 400, 401, 403 |
| PATCH | `/api/courses/{id}/publish` | INSTRUCTOR (owner) | — | `200 CourseResponse` | 401, 403, 404 |

### Enrollment Endpoints

| Method | URL | Role | Request Body | Success Response | Errors |
|---|---|---|---|---|---|
| POST | `/api/enrollments/{courseId}` | STUDENT | — | `200 MessageResponse` | 401, 403, 404, 409 |
| PATCH | `/api/enrollments/{courseId}/drop` | STUDENT | — | `200 MessageResponse` | 400, 401, 403 |
| GET | `/api/enrollments/my-courses` | STUDENT | — | `200 [EnrollmentResponse]` | 401, 403 |
| GET | `/api/enrollments/{courseId}/status` | STUDENT | — | `200 EnrollmentStatusResponse` | 401, 403 |

### Response Shapes

**CourseResponse:**
```json
{
    "id": 1,
    "title": "Introduction to Java Programming",
    "description": "Learn Java from the ground up...",
    "imageUrl": "https://...",
    "instructorName": "Dr. Grace Nkemdirim",
    "published": true
}
```

**CourseDetailResponse:**
```json
{
    "id": 1,
    "title": "Introduction to Java Programming",
    "description": "...",
    "imageUrl": "...",
    "instructorName": "Dr. Grace Nkemdirim",
    "published": true,
    "materials": [
        { "id": 1, "materialType": "TEXT", "title": "What is Java?", "content": "Java is...", "contentUrl": null, "orderIndex": 1 },
        { "id": 2, "materialType": "VIDEO", "title": "Installing the JDK", "content": null, "contentUrl": "https://...", "orderIndex": 2 }
    ]
}
```

**EnrollmentStatusResponse:**
```json
{ "enrolled": true, "status": "ACTIVE", "progressPercent": 0.0 }
{ "enrolled": false, "status": null, "progressPercent": null }
```

**Error Response (all endpoints):**
```json
{ "error": "Course not found: 99" }
{ "error": "You are already enrolled in this course" }
```

---

## 14. Complete End-to-End Flows

### Flow 1: Student Views Course Catalog

1. **Browser** — `StudentDashboard` mounts, `useEffect` fires
2. **Axios** — fires two parallel requests: `GET /api/courses` and `GET /api/enrollments/my-courses`
3. **JwtFilter** — validates Bearer token, extracts userId=3, sets security context with `ROLE_STUDENT`
4. **`@PreAuthorize("hasRole('STUDENT')")`** — evaluates to true for both endpoints
5. **CourseController.getPublishedCourses()** — calls `courseService.getPublishedCourses()`
6. **CourseService** — `courseRepository.findAllByPublishedTrue()` → SQL: `SELECT * FROM courses WHERE published = TRUE`
7. **Hibernate** — maps 3 result rows to 3 `Course` objects (draft course excluded by `WHERE` clause)
8. **CourseService** — `.stream().map(this::toCourseResponse)` — for each Course, reads `course.getInstructor()` (lazy load fires: `SELECT * FROM users WHERE id = ?`), extracts `getFullName()`, builds `CourseResponse`
9. **EnrollmentController.getMyCourses()** — calls `enrollmentService.getMyCourses(3L)`
10. **EnrollmentService** — `findAllByStudentIdAndStatus(3L, ACTIVE)` → SQL: `SELECT * FROM enrollments WHERE student_id = 3 AND status = 'ACTIVE'`
11. **Both responses arrive** — React sets state: `setCourses([3 courses])`, `setEnrollments([...])`
12. **React renders** — course grid shows 3 cards. Cards for enrolled courses show `✓ Enrolled` badge
13. **Search** — user types in search box, `setSearch()` updates state, `filtered = courses.filter(...)` recalculates, React re-renders filtered grid. Zero network requests.

### Flow 2: Student Enrolls in a Course

1. **Student** clicks "Enroll Now" on `CourseDetailPage`
2. **handleEnroll()** — `setActing(true)`, calls `enrollmentService.enroll(courseId)`
3. **Axios** — `POST /api/enrollments/1` with Bearer token
4. **JwtFilter** — validates token, extracts `userId=3`, sets `ROLE_STUDENT` in security context
5. **`@PreAuthorize("hasRole('STUDENT')")`** — passes
6. **EnrollmentController.enroll(1L, 3L)** — delegates to `enrollmentService.enroll(1L, 3L)`
7. **Spring AOP** — opens transaction
8. **EnrollmentService.enroll():**
   - `courseRepository.findById(1L)` → loads Course id=1
   - `course.getPublished()` → `true` → passes
   - `enrollmentRepository.existsByStudentIdAndCourseId(3L, 1L)` → SQL: `SELECT COUNT(*) FROM enrollments WHERE student_id = 3 AND course_id = 1` → 0 → `false`
   - `userRepository.findById(3L)` → loads Student user
   - `new Enrollment()` → constructor sets `enrolledAt = now()`, `status = ACTIVE`, `progressPercent = 0.0`
   - `enrollment.setStudent(student)`, `enrollment.setCourse(course)`
   - `enrollmentRepository.save(enrollment)` → INSERT into enrollments, trigger runs on users (wrong table, trigger is on users table only), database sequence generates id=7
9. **Transaction commits** — enrollment row written to database
10. **Response** — `200 { "message": "Successfully enrolled in Introduction to Java Programming" }`
11. **Frontend** — `setMessage(res.data.message)`, `setStatus({ enrolled: true, status: 'ACTIVE', progressPercent: 0 })`
12. **React re-renders** — green success message appears, buttons change from "Enroll Now" to "Attend Course" + "Drop Course"

### Flow 3: Instructor Creates and Publishes a Course

**Creating:**
1. Instructor fills form, clicks "Create Course"
2. `POST /api/courses` with `{ "title": "Python Basics", "description": "...", "imageUrl": "..." }`
3. `@PreAuthorize("hasRole('INSTRUCTOR')")` — passes
4. `CourseService.createCourse()` — loads instructor User, creates `new Course()`, sets fields, `setPublished(false)`
5. `courseRepository.save(course)` → `INSERT INTO courses (title, description, image_url, instructor_id, published) VALUES (?, ?, ?, ?, FALSE)`
6. Response: `201 { "id": 5, "title": "Python Basics", ..., "published": false }`
7. Frontend: `setCourses(prev => [res.data, ...prev])` — new course appears at top of list with "Draft" badge

**Publishing:**
1. Instructor clicks "Publish" button on the new course card
2. `window.confirm()` → instructor confirms
3. `PATCH /api/courses/5/publish`
4. `CourseService.publishCourse(5L, instructorId)` — loads course, checks `course.getInstructor().getId().equals(instructorId)` → passes
5. `course.setPublished(true)` — dirty checking will detect this change
6. `courseRepository.save(course)` → `UPDATE courses SET published = TRUE WHERE id = 5`
7. Response: `200 { ..., "published": true }`
8. Frontend: `setCourses(prev => prev.map(c => c.id === 5 ? res.data : c))` — course badge changes from "Draft" to "✓ Published"

---

## 15. Design Patterns Catalogue

### Repository Pattern
Spring Data repositories are a textbook implementation of the Repository Pattern. The repository provides a collection-like interface for accessing domain objects, abstracting the underlying data store. `courseRepository.findAllByPublishedTrue()` reads like a collection query; it makes no mention of SQL, connections, or result sets.

### Data Transfer Object (DTO) Pattern
Every service method converts entities to DTOs before returning. The DTO is a flat, serializable representation of data designed for transport across a boundary. The DTO pattern separates the internal domain model from the external API contract.

### Factory Method Pattern (implicit)
`CourseService.createCourse()` acts as a factory for `Course` objects. It encapsulates the creation logic: which fields to set, what defaults to apply, how to associate the instructor. Callers do not use `new Course()` directly; they call `createCourse()` and receive a fully initialized `CourseResponse`. The factory centralizes creation policy.

### State Pattern (Enrollment)
`Enrollment` transitions between states (`ACTIVE` → `DROPPED`) through the `setStatus()` method. `EnrollmentService` manages these transitions and enforces valid transitions (you cannot drop an already-dropped enrollment). In a more complex design, each state would be a class with its own behaviour — the State Pattern. The enum + service combination is the lightweight equivalent.

### Observer Pattern (React state)
React's `useState` and component re-rendering implement a simplified Observer Pattern. `setCourses(data)` notifies React (the observer) that state has changed. React re-renders all components that consume the `courses` state — without the component explicitly triggering a re-render. The component declares what it needs (via `useState`); React decides when to re-render.

### Strategy Pattern (Material Rendering)
`CourseAttendPage.tsx` selects a rendering strategy based on `materialType`. `TEXT` → render paragraph. `VIDEO` → render play link. `FILE` → render download link. `LINK` → render external link. Each rendering strategy is a different branch of the conditional. In a larger system, each would be a separate component: `<TextMaterial>`, `<VideoMaterial>`, `<FileMaterial>`.

### Proxy Pattern (Spring Data, AOP)
Spring Data creates a proxy implementation of `CourseRepository` at runtime — a class that implements the interface but delegates to Hibernate. Spring AOP creates proxy wrappers around `@Service` beans — intercepting `@Transactional` method calls to manage transactions. Both are examples of the Proxy Pattern: an object that controls access to another object by sitting in between.

---

## 16. Sprint 2 Invariants and Business Rules

These rules are enforced by the system and cannot be violated by normal API usage:

**INV-S2-001: Only published courses are visible to students.**
Enforced in `CourseService.getPublishedCourses()` (WHERE clause) and `getCourseDetail()` (explicit check). An unpublished course returns 404, not 403 — preventing information leakage about the unpublished catalog.

**INV-S2-002: Every course starts as an unpublished draft.**
Enforced in `Course()` constructor (`this.published = false`), `CourseService.createCourse()` (explicit `setPublished(false)`), and database default (`DEFAULT FALSE`). Three independent enforcement points.

**INV-S2-003: An instructor can only publish their own courses.**
Enforced in `CourseService.publishCourse()` with `course.getInstructor().getId().equals(instructorId)` check before setting published.

**INV-S2-004: A student cannot enroll in the same course twice.**
Enforced in `EnrollmentService.enroll()` with `existsByStudentIdAndCourseId()` check (application layer) and `UNIQUE (student_id, course_id)` database constraint (database layer).

**INV-S2-005: Dropping a course does not delete the enrollment record.**
Enforced by design: `EnrollmentService.drop()` calls `setStatus(DROPPED)` and `save()` — never `delete()`. The enrollment record is permanent; only its status changes.

**INV-S2-006: Only actively enrolled students can attend a course.**
Enforced in `CourseController.attendCourse()` with `isActivelyEnrolled()` check. DROPPED students cannot access course materials.

**INV-S2-007: Course materials are ordered by order_index, ascending.**
Enforced at three points: `@OrderBy("orderIndex ASC")` on the `Course.materials` collection, manual `.sorted()` in `CourseService.toCourseDetailResponse()`, and `idx_materials_order` composite index on `(course_id, order_index)` in the database.

**INV-S2-008: When an instructor is deleted, their courses are NOT deleted.**
Enforced by `ON DELETE SET NULL` on `courses.instructor_id`. The service handles the null case with `course.getInstructor() != null ? ... : "Unknown"`.

**INV-S2-009: When a course is deleted, all its materials are deleted.**
Enforced by `ON DELETE CASCADE` on `course_materials.course_id` (database) and `cascade = CascadeType.ALL, orphanRemoval = true` (JPA).

**INV-S2-010: When a student or course is deleted, their enrollment records are deleted.**
Enforced by `ON DELETE CASCADE` on both `enrollments.student_id` and `enrollments.course_id`.

---

*End of Sprint 2 Documentation — CEF331 Group 12, University of Buea*
*Backend: Java 17 + Spring Boot 4.0.6 + Spring Security 6 + Spring Data JPA + Hibernate + JJWT 0.12.6 + BCrypt + PostgreSQL 14*
*Frontend: React 18 + TypeScript 5 + React Router 6 + Axios 1.6 + Vite*
