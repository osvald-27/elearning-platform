# The E-Learning Platform — What Are We Building?

**University of Buea · CEF331 · Group 12**

---

## The Simple Version

We are building a website where:

- **Students** can sign up, browse courses, enroll, attend learning materials, and take quizzes
- **Instructors** can sign up, create courses, upload materials, and create quizzes
- **Admins** manage who is allowed on the platform — they approve instructor and admin accounts before those people can log in

That'sv literally all there is to it bruv. Three types of people under one platform. Each person can only do what their role allows.

---

## Why Does This Exist?

Right now, if a lecturer at UB wants to share course materials with students, they have no clean digital way to do it. Students have no way to enroll, attend, and be assessed — all in one place. This platform solves that.

---

## The Three Parts of the System

This platform is split into three separate layers that talk to each other. Think of it like the classic restaurant analogy you see on youtube video that teaches backend and its tech stack (no all buh you get my point):

**The Menu (Frontend — React)**
This is what you see. The web pages, the buttons, the forms. It runs in your browser. It never stores anything permanently, like no real logic or persistency, apart from something called a token — it just displays information and sends your actions to the kitchen.

**The Kitchen (Backend — Java Spring Boot)**
This is where the rules live. Is this user allowed to enroll? Has this student already taken this quiz? Is this password correct? The kitchen never talks to the customer directly — it only talks through the menu. And it enforces every business rules before you even get to the database.

**The Storage Room (Database — PostgreSQL)**
This is where everything is permanently saved: user accounts, courses, enrollments, quiz results, certificates. The storage room only receives instructions from the kitchen — it never talks to the menu directly.

This separation is called **3-tier architecture** and it is the foundation of everything we build.

---

## How the Three Sprints Fit Together

We are building this in three sprints, each one adding a complete layer of functionality on top of the last:

| Sprint | Theme | What Gets Built |
|--------|-------|-----------------|
| Sprint 1 | Identity | Who are you? Register, login, prove your role |
| Sprint 2 | Learning | What can you learn? Browse, enroll, attend, create |
| Sprint 3 | Assessment | Did you learn it? Quizzes, results, certificates, admin approval |

Each sprint delivers something a real user can actually use end to end. A sprint is not done if the database works but the UI doesn't, or if the backend is complete but untested. Done means a real person can click through the whole flow.

---

## The People in the System

### Student
A student is the main user. They arrive, create an account, and are approved automatically. They browse published courses, enroll in the ones they want, attend the learning materials, and take quizzes. If they pass, they earn a certificate.

### Instructor
An instructor creates and teaches courses. They sign up, but they **cannot log in until an Admin approves their account**. Once approved, they can create courses, add learning materials in order, and create quizzes with multiple-choice questions.

### Admin
An admin manages the people. They approve or revoke instructor and admin accounts. They can see all users and all courses. There is always at least one admin seeded into the system from the start — otherwise nobody can ever approve anyone.

---

## The Rules Everyone Follows

These apply to every layer, sprint, and definitely every single team member:

**Rule 1: Layers don't skip layers.**
The UI never touches the database. The database never enforces business logic. The backend is the only place rules are checked.

**Rule 2: No plain-text passwords. Ever.**
Passwords are always scrambled (hashed) before being stored. We use a standard one-way scrambling algorithm so that even if someone reads the database, they cannot get anyone's password.

**Rule 3: Every action requires the right role.**
A student cannot create a course. An instructor cannot approve another user. These checks happen on the server — not on the frontend, because a frontend can be bypassed.

**Rule 4: Authentication uses tokens.**
After you log in, the server gives you a token (a signed string of characters). You attach that token to every request you make. The server reads the token to know who you are and what you're allowed to do.

**Rule 5: The API contract is law.**
The backend and frontend communicate through a set of agreed endpoints. These are written down in `API_CONTRACTS.md` in the repository. Nobody invents new endpoints without updating that file first.

**Rule 5: Build with AI, responsibly.**
These files especially the file "meant for AI" should be used to generate AI code, debugging random code is painful and pushing random code anywhere is architecture diseaster.

---

## What Is in the Repository

```
elearning-platform/
├── database/        ← SQL schema and seed data (Database team)
├── backend/         ← Java Spring Boot API (Backend team)
├── frontend/        ← React TypeScript app (UI team)
├── API_CONTRACTS.md ← The contract between backend and frontend (Lead owns this)
└── README.md        ← Team rules and setup instructions
```

Every piece of code lives in one of those folders. Every team works on their own folder. Changes are made through branches and pull requests — nobody pushes directly to `main` or `dev`.

---

## The Technology Stack in Plain Terms

| Layer | Technology | What It Does |
|-------|-----------|--------------|
| Frontend | React + TypeScript | Builds the web pages users interact with |
| Backend | Java + Spring Boot | Runs the server, enforces the rules, issues tokens |
| Database | PostgreSQL | Stores everything permanently in structured tables |
| Auth | JWT (JSON Web Token) | A signed "ID card" given to users after login |
| Password security | BCrypt | One-way scrambling of passwords before storage |

---

*This document is the overview. Read it first before you go and read the sprint document.*
