# Sprint 1 — Identity: Who Are You?

**Goal: A user can register, log in, and reach their dashboard.**

---

## What This Sprint Delivers

By the end of Sprint 1, a real person can:

1. Open the website and see a Register page
2. Fill in their name, email, password, and choose their role
3. Submit the form and have an account created
4. Go to the Login page, enter their credentials, and be taken to the right dashboard based on their role
5. Students land immediately. Instructors and Admins see a "pending approval" message instead.

That's the entire scope. No courses. No quizzes. Just identity.

---

## The Core Design Problem

Every person who uses this system is a *user* in some general sense — they all have a name, an email, and a password. But nobody is *just* a user. You are either a Student, an Instructor, or an Admin, and those three types of people have completely different abilities.

This is exactly the situation that **inheritance** in Object-Oriented Programming was designed for.

---

## OOP Concept: Why We Need an Abstract Class

On a more conceptual level, just imagine you have three boxes: one for Students, one for Instructors and the last one for Admins. Each box holds a person. Every person in every box has a name, an email, and a password. It would be wasteful to write those three fields three separate times for three separate boxes, in order words similar attributes for different types of entities are better inherited.

The solution is to have a **parent** that holds the common stuff, and three **children** that inherit from it and add only what makes them different, this is the **concept of polymorphism**, many times you just use a simple Inheritance to implement this eh.

In OOP, when a parent class is designed to *never be used on its own* — because a bare "User" with no role makes no sense in our system — we call it an **abstract class**.

> **Abstract class:** A class that defines shared structure and behaviour for a family of related classes, but cannot be created on its own. You cannot create a plain `User` — you must always create a `Student`, an `Instructor`, or an `Admin`. Those three are the **concrete classes** — the ones that can actually be instantiated.

An abstract class can also define **abstract methods** — methods it declares but does not implement, forcing every concrete subclass to provide their own version. This is a form of **polymorphism**: the same method name does different things depending on which type of object you're actually working with.

### Applied to our system:

`User` is the abstract parent. It holds: name, email, password, role, approved status, and the creation timestamp.

`Student`, `Instructor`, and `Admin` each extend `User`. They inherit everything from `User` and can add their own specific fields or behaviours later.

This means that when the Login system retrieves a user from the database, it doesn't need to ask "is this a Student or an Instructor?" to get their name and email. It just asks the `User`. The role tells it what to do next.

---

## OOP Concept: Encapsulation

Every field in `User` — the password, the email, the approved status — is **private**. Private means only the class itself can read or change those values directly.

To let the outside world interact with those fields, we provide **getters** (to read a value) and **setters** (to change a value). This is **encapsulation**.

Why does this matter? Because if the password field were public, any piece of code anywhere in the system could read or change it directly, with no checks. By making it private and only allowing change through controlled methods, we can ensure the password is always hashed before it is ever stored.

---

## OOP Concept: The Service Layer and Single Responsibility

Every class in our backend has exactly **one job**. This is called the **Single Responsibility Principle**.

The class that handles authentication is the `AuthService`. Its one job is to contain all business rules related to registering and logging in. It does not build web pages. It does not write SQL. It just knows the rules.

The class that receives the HTTP request from the browser is the `AuthController`. Its one job is to receive the request, pass it to the service, and return the response. It contains **zero business logic**. If a controller is making a decision, that decision is in the wrong place.

The class that reads from and writes to the database is the `UserRepository`. Its one job is data access. It does not know what BCrypt is. It does not know what a JWT is. It just stores and retrieves.

This three-layer pattern — Controller → Service → Repository — is the backbone of the entire backend and must be respected in every sprint.

---

## The Approval Problem (A Critical Design Decision)

When an Instructor or Admin registers, they should **not** be allowed to log in immediately. They need an Admin to approve them first. This is why every user record has an `approved` field.

- When a Student registers: `approved` is set to `true` immediately (they can log in right away)
- When an Instructor or Admin registers: `approved` is set to `false` (they are blocked from logging in)

The login check must look at `approved` before issuing a token. If `approved` is false, the server returns a **403 Forbidden** response with the message "Account pending admin approval." It does not return the same "Invalid credentials" message that a wrong password gives — that would hide useful information from the user.

The Admin approval endpoint — which flips `approved` to `true` — is built in Sprint 3. For Sprint 1, we just make sure the field is there and the login check respects it.

---

## The Password Problem (A Non-Negotiable Security Rule)

Passwords must **never** be stored as plain text. If the database were ever compromised, every user's password would be exposed.

Instead, passwords are run through a **one-way hashing algorithm** (BCrypt) before being stored. BCrypt turns "mypassword123" into a long, scrambled string like `$2a$10$XnQ...`. When a user logs in, we run their entered password through the same algorithm and compare the scrambled results — we never "un-scramble" the stored password, because it is mathematically impossible to reverse the hash.

---

## The Token Problem (How the Server Knows Who You Are After Login)

HTTP requests have no memory. Every request is independent — the server does not automatically know that request #47 came from the same person as request #46.

To solve this, after a successful login the server generates a **JWT (JSON Web Token)**. A JWT is a signed string that contains: the user's ID, their role, and an expiry time. It is signed with a secret key that only the server knows.

The frontend stores this token and attaches it to the header of every future request. The server reads the token, verifies the signature, and extracts the user ID and role — without needing to look up the database for every single request.

---

## Implementation Steps — What Each Team Does

### Database Team

The database team is responsible for the `users` table. This table must exist and be correct before the backend team can connect to it.

The `users` table needs columns for: a unique ID, full name, email (which must be unique across the whole table), a password hash (not the plain password), the role (one of three allowed values), a boolean for approved status that defaults to false, and a timestamp for when the account was created.

The clever part is that na, the database itself can automatically set `approved = true` for any new row where the role is STUDENT. This is handled by a database trigger — a small piece of logic that runs automatically before a row is inserted. This means the backend team does not need to write special code for the student case — the database handles it.

The database team delivers: the `schema.sql` file, a `seed.sql` file with at least one pre-approved admin account, and confirmation that the schema runs without errors on a clean PostgreSQL database.

### Backend Team

The backend team builds the two endpoints that power Sprint 1.

**Register** receives a name, email, password, and role. It must check that the email is not already taken. It must scramble the password with BCrypt before saving. It must set `approved` based on the role. It returns a clear message — either "Account created" for students, or "Account created, pending approval" for instructors and admins.

**Login** receives an email and password. It must find the user by email. If no user is found, return a 401. If the password does not match the stored hash, return a 401 (the error message must not reveal whether the email exists — that would be a security leak). If the password matches but `approved` is false, return a 403 with the pending approval message. If everything checks out, generate a JWT containing the user's ID and role, and return it along with the role and user ID.

The backend team also sets up Spring Security — configured so that only the register and login endpoints are public. Every other endpoint requires a valid JWT.

### UI Team

The UI team builds three things.

**The Register page** has fields for full name, email, password, confirm password, and a role dropdown (Student, Instructor, Admin). When an Instructor or Admin role is selected, a visible yellow notice appears explaining that the account requires admin approval. On successful submission, the message from the server is shown to the user. On error (email taken, invalid role), the error from the server is shown directly below the relevant field.

**The Login page** has fields for email and password. On success, the token and role are stored in the application's auth context (a piece of shared state that the whole app can read). The user is then redirected to the correct dashboard based on their role. On error, the server's error message is shown.

**The Auth Context** is the central token store. It holds the token, the role, the user ID, and the user's name after login. It also provides a logout function. Every page that requires authentication reads from this context. If there is no token, the user is redirected to the login page automatically.

---

## Sprint 1 Is Done When

- A student can register and immediately log in
- An instructor who registers sees the "pending approval" message and cannot log in
- An admin can approve the instructor (this is tested manually using a database tool — the admin UI is Sprint 3)
- After approval, the instructor can log in
- A wrong password returns an error message in the UI
- Passwords in the database are hashed — not plain text
- The JWT is stored in the frontend and attached to requests

---

*Read Sprint 2 when this is complete and merged to dev.*
