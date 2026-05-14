# Sprint 2 — Learning: What Can You Learn?

**Goal: A student can find a course, enroll, attend materials, and drop. An instructor can create and publish a course.**

---

## What This Sprint Delivers

By the end of Sprint 2, a real person can:

1. Log in as a student, see a grid of published courses
2. Click a course, see its details and materials
3. Click Enroll and be enrolled
4. Click Attend and access the course materials in order
5. Click Drop and leave the course
6. Log in as an instructor and create a new course with materials

Sprint 2 does not include quizzes — those come in Sprint 3. It also does not include the admin panel. The focus here is entirely on the learning experience.

---

## The Core Design Problem

In Sprint 1, we solved identity. Now we need to model the *things* in the system — courses, materials, and the relationship between students and courses.

The relationship between a student and a course is interesting. It is not simply that "a student has courses" or "a course has students." It is more specific: a student is **enrolled** in a course, and that enrollment has properties of its own — when it happened, whether it is active or dropped, how far through the material the student has progressed.

This middle-ground object — the Enrollment — is its own thing. In OOP terms, this is called an **association class**: a class that represents the relationship between two other classes, and carries data about that relationship.

---

## OOP Concept: Relationships Between Objects

In OOP, classes relate to each other in different ways. The two most important for Sprint 2 are:

**One-to-Many:** One instructor creates many courses. One course has many materials. These are one-to-many relationships. In the database, the "many" side holds a reference (a foreign key) to the "one" side.

**Many-to-Many through an association class:** Many students can enroll in many courses. But if we just drew a direct line between Student and Course, we would lose all the useful information — when did they enroll? Did they drop? What is their progress? The solution is to put an `Enrollment` class in between. It holds references to both the Student and the Course, plus all the extra information about that specific relationship.

This pattern is extremely common in real systems. Anytime you have a many-to-many relationship with properties, you need an association class.

---

## OOP Concept: Composition

A course is made up of materials. Without the course, the materials do not exist independently — they belong to the course. This is called **composition**: one class is composed of other classes, and the composed parts live and die with the whole.

This is different from a simple association. An instructor's account would still exist even if the course were deleted. But a course material that belongs to a course should be deleted when the course is deleted. The database enforces this with a "cascade delete" rule on the foreign key.

---

## OOP Concept: Encapsulating Business Rules in the Service Layer

Sprint 2 introduces several business rules that must live exclusively in the service layer — never in the controller, never in the frontend.

**Enrollment rules:**
- The course must exist before you can enroll in it
- A student cannot enroll in the same course twice — this is enforced at the database level with a unique constraint on the combination of student ID and course ID, and also checked in the service before attempting the insert
- Only users with the STUDENT role can enroll
- Dropping a course does not delete the enrollment record — it changes the status from ACTIVE to DROPPED. This preserves history.

**Course visibility rules:**
- A course can exist in the database in an unpublished state (a draft). Students cannot see unpublished courses.
- Only courses where `published = true` are returned when students browse the course list.
- An instructor can create a course and leave it as a draft until they are ready.

**Instructor ownership rules:**
- An instructor can only edit their own courses
- The backend checks that the instructor making the edit request is the same instructor who owns the course

Every one of these rules is a decision made in the service layer. The controller receives the request and the repository saves or retrieves data. The service is where the question "should I allow this?" is answered.

---

## The Ordering Problem for Materials

Course materials need to appear in a specific order. Week 1 comes before Week 2. The introduction comes before the advanced content. If we just saved materials and retrieved them in random database order, the learning experience would be meaningless.

The solution is an `order_index` field on every material. When the instructor uploads materials, they specify the order. When students attend the course, materials are sorted by `order_index` before being returned. This is a simple solution to a real problem, and it is completely invisible to the user.

---

## Implementation Steps — What Each Team Does

### Database Team

No new tables need to be created in Sprint 2 — the schema written in Sprint 1 already includes `courses`, `enrollments`, and `course_materials`. The work in Sprint 2 is verification.

The team must confirm:

The `courses.published` column exists and defaults to false. Run a test: insert a course with no explicit `published` value and confirm it shows up as false.

The `enrollments` table has a unique constraint on the combination of student ID and course ID. Run a test: try to insert two enrollment rows for the same student and the same course. The second insert must fail with a constraint violation.

The `course_materials` table has an `order_index` column. Confirm it exists and that materials can be retrieved sorted by that column.

If any of these things are missing or incorrect, the database team fixes the schema and creates a migration file for the change. They do not just edit the original schema file — they create a new migration so that anyone who already ran the schema can apply just the change.

The team also adds more seed data: at least three published courses with materials and at least one unpublished course (to test that students cannot see it).

### Backend Team

The backend team builds the full course and enrollment system.

**For courses:**

The endpoint that returns all published courses receives a JWT and returns a list of courses that are marked as published. Each course in the response includes the title, description, image URL, and the instructor's name — not their ID, because the frontend should not need to make a second request just to get the instructor's name.

The endpoint that returns one course by its ID returns the same information plus the list of materials, sorted by their order index.

The endpoint that creates a course requires an INSTRUCTOR role and creates the course as an unpublished draft by default.

**For enrollments:**

The enroll endpoint requires a STUDENT role. It checks that the course exists. It checks that the student is not already enrolled. It creates the enrollment with a status of ACTIVE. If the student is already enrolled, it returns a 409 Conflict response.

The drop endpoint requires a STUDENT role and confirms the student is currently enrolled with ACTIVE status before changing the status to DROPPED. If the student is not enrolled, it returns a 400 Bad Request.

The "my courses" endpoint returns all courses a student is actively enrolled in, including the progress percentage for each one.

The "enrollment status" endpoint takes a course ID and returns whether the student is enrolled, and what their enrollment status is. This is called every time a student opens a course detail page — it is how the frontend knows which buttons to show.

### UI Team

The UI team builds the course browsing and attendance experience.

**The Student Dashboard** is a grid of cards. Each card shows the course image, title, and instructor name. If the student is already enrolled in a course, a small badge appears on that card. The dashboard makes two API calls when it loads: one to get all published courses, and one to get all the student's enrolled courses. It combines those two lists to know which courses have the enrolled badge. There is a search bar that filters the cards in real time — this filtering happens on the frontend, not by making new API calls.

**The Course Detail Page** opens when a student clicks a card. It shows the full course description and a set of action buttons. The buttons shown depend entirely on the enrollment status received from the API — not from local state in the browser. If the student is not enrolled, only the Enroll button is active. If they are enrolled and active, the Attend and Drop buttons are active. The buttons change immediately after a successful enrollment or drop without needing to reload the page.

**The Course Attend Page** opens after a student clicks Attend. It shows the list of materials in order. Each material is displayed according to its type: a text material shows the text content, a video material shows a link or embedded player, a file material shows a download link. This page is only accessible if the student is actually enrolled — if they navigate directly to the URL without being enrolled, they are redirected back to the course detail page.

**The Instructor Dashboard** shows the instructor their own courses. Each course shows the title, whether it is published, and the number of enrolled students. There is a Create Course button that opens a form for title, description, and image URL. When the form is submitted, the new course appears in the list as an unpublished draft.

---

## Sprint 2 Is Done When

- A logged-in student can see the course grid with all published courses
- Clicking a course opens the detail page
- Enrolling works — the buttons change to Attend and Drop
- Attempting to enroll twice shows an error message from the server
- Attending a course shows the materials in the correct order
- Dropping a course changes the buttons back to Enroll
- An unpublished course does not appear in the student's course list
- An instructor can log in, create a course, and see it in their dashboard
- The enrollment record is not deleted when a course is dropped — the status changes to DROPPED

---

*Read Sprint 3 when this is complete and merged to dev.*
