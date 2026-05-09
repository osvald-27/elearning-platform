# Sprint 1 — Identity: Complete Documentation

**Status:** COMPLETED
**Date:** May 8, 2026  
**Team:** E-Learning Platform — University of Buea, CEF331, Group 12

---

## Executive Summary

Sprint 1 delivers a complete user authentication for the e-learning platform. Users can register with role-based accounts (Student, Instructor, Admin), log in with JWT tokens, and finally, access role-specific dashboards. Students are auto-approved; instructors and admins require manual approval before login.

**What works end-to-end:**
- Registration with email/password and role selection
- Login with approval workflow
- Role-based dashboard routing
- Token persistence across browser refresh
- Protected routes (redirect to login if unauthenticated)
- Account approval enforcement (403 Forbidden for pending accounts)

---

## Architecture Overview

### Three-Tier System

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React 18 + TypeScript 5 + React Router 6 + Axios)    │
│ ├─ AuthContext (stores token, role, userId, fullName)           │
│ ├─ ProtectedRoute (enforces role-based access)                  │
│ ├─ Pages: Register, Login, 3 Dashboards                         │
│ └─ localStorage persistence (survives page refresh)             │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP / Axios
                       │ POST /api/auth/register
                       │ POST /api/auth/login
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (Java 25 + Spring Boot 4.0.6 + Spring Security 6)      │
│ ├─ AuthService (register, login, password encoding, JWT)        │
│ ├─ AuthController (HTTP endpoints)                              │
│ ├─ JwtUtil (token generation & validation)                      │
│ ├─ JwtFilter (attaches auth to every request)                   │
│ ├─ GlobalExceptionHandler (centralized error responses)         │
│ └─ Spring Security (stateless, 2 public routes, rest protected) │
└──────────────────────┬──────────────────────────────────────────┘
                       │ JDBC / Hibernate
                       │ SELECT/INSERT users table
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE (PostgreSQL 18)                                        │
│ ├─ users table (SINGLE_TABLE inheritance)                       │
│ │  ├─ id, full_name, email, password_hash                      │
│ │  ├─ role (ENUM: STUDENT, INSTRUCTOR, ADMIN)                  │
│ │  ├─ approved (BOOLEAN, triggers auto-approve for STUDENT)    │
│ │  └─ created_at (timestamp)                                   │
│ ├─ Trigger: auto_approve_student (sets approved=true on insert)│
│ └─ Indexes: idx_users_email, idx_users_role                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

**Created with:** `database/schema.sql`

### users Table

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Columns:**
- `id` — Auto-increment primary key, this here is also used in JWT subject
- `full_name` — User's display name (2–150 chars)
- `email` — Unique identifier, used for login
- `password_hash` — BCrypt-hashed password (never plain text)
- `role` — PostgreSQL ENUM: `STUDENT`, `INSTRUCTOR`, `ADMIN`
- `approved` — Boolean; students auto-approved via trigger, others default false
- `created_at` — Account creation timestamp

**Trigger:** `auto_approve_student`
```sql
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
```

**Indexes:**
- `idx_users_email` — This speeds up login queries (find by email)
- `idx_users_role` — This also speeds up  transactions, particularly, role-based queries (future sprints)

**Seed Data:** `database/seed.sql`
- One admin account: `oswaldkarisma27@gmail.com` / password `admin123`
- Hash: `$2a$10$VVHgQb0p8dYVhKPZ48yqMuK5V1rXwT.c8Y4.J4.Cxq5X8yP7kqIf2` (BCrypt strength 10)

---

## Backend Implementation

### Object-Oriented Design: Inheritance

**User Hierarchy (Single-Table Inheritance):**

```java
@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "role", discriminatorType = DiscriminatorType.STRING)
public abstract class User { ... }

public class Student extends User { ... }
public class Instructor extends User { ... }
public class Admin extends User { ... }
```

**Why?** All users share the same columns (name, email, password, role, approved). Subclassing allows role-specific behavior (setters for Instructor enrollment limits, Admin permissions) without duplicating schema.

---

### AuthService — Business Logic Layer

**Methods:**

#### `register(RegisterRequest)`
1. Check email not already taken → throw `EmailAlreadyExistsException` (400)
2. Parse role string → convert to Role enum → throw `InvalidCredentialsException` if invalid
3. Create role-specific User object (Student/Instructor/Admin)
4. Hash password with BCrypt (strength 10)
5. Save to database
6. Database trigger automatically sets `approved=true` if STUDENT
7. Return message (students: "ready to log in", others: "pending approval")

#### `login(LoginRequest)`
1. Find user by email
2. Compare provided password with stored hash using BCrypt
3. If email-not-found OR password-mismatch → throw `InvalidCredentialsException` (401)
   - **Security:** Unified message doesn't reveal if email exists
4. Check `approved` field
5. If `approved=false` → throw `AccountNotApprovedException` (403)
6. Generate JWT token (userId + role) with 24-hour expiration
7. Return `LoginResponse` (token, role, userId, fullName)

**Exception Hierarchy:**
- `EmailAlreadyExistsException` → 400 Bad Request (registration only)
- `InvalidCredentialsException` → 401 Unauthorized (login)
- `AccountNotApprovedException` → 403 Forbidden (login)

---

### AuthController — HTTP Endpoints

**POST `/api/auth/register`**

Request:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "STUDENT"
}
```

Response (201 Created):
```json
{
  "message": "User registered successfully"
}
```

Errors:
- **400** — Email already exists | Validation failed (see `details` field)
- **400** — Invalid role

---

**POST `/api/auth/login`**

Request:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Response (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "STUDENT",
  "userId": 42,
  "fullName": "John Doe"
}
```

Errors:
- **401** — Invalid credentials (email not found OR password mismatch)
- **403** — Account pending admin approval

---

### Security Configuration

**Spring Security (Stateless JWT):**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .cors().and()
            .authorizeRequests()
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .anyRequest().authenticated()
            .and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

**What this means:**
- Only `/api/auth/register` and `/api/auth/login` are public
- All other endpoints require a valid JWT token in the `Authorization: Bearer <token>` header
- No server-side sessions (stateless) — every request is self-contained
- CORS enabled for `localhost:3000`

---

### JWT Token Structure

Generated by `JwtUtil.generateToken(userId, role)`:

```
Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": "42", "role": "STUDENT", "iat": 1714118400, "exp": 1714204800 }
Signature: HMAC-SHA256(header.payload, secret)
```

**Claims:**
- `sub` — Subject (user ID)
- `role` — User role (STUDENT, INSTRUCTOR, ADMIN)
- `iat` — Issued at (Unix timestamp)
- `exp` — Expiration (24 hours from issued)

**Verification:** JwtFilter extracts userId + role on every request, sets Spring Security context.

---

## Frontend Implementation

### React Architecture

**Core Files:**
- `src/types/index.ts` — TypeScript types (Role, RegisterRequest, LoginRequest, etc.)
- `src/services/api.ts` — Axios instance with request interceptor (attaches Bearer token)
- `src/context/AuthContext.tsx` — Global auth state (token, role, userId, fullName)
- `src/components/ProtectedRoute.tsx` — Route wrapper that enforces role + redirects
- `src/pages/` — RegisterPage, LoginPage, 3 Dashboards

---

### AuthContext — Centralized Token Storage

```typescript
export const AuthProvider: React.FC = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    role: null,
    userId: null,
    fullName: null,
  });

  useEffect(() => {
    // On mount, rehydrate from localStorage
    const token = localStorage.getItem('token');
    if (token) setAuthState({ token, role, userId, fullName });
  }, []);

  const login = (response: LoginResponse) => {
    setAuthState({ token, role, userId, fullName });
    // Persist to localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    // ...
  };

  return <AuthContext.Provider value={{ ...authState, login, logout }}>{children}</AuthContext.Provider>;
};
```

**Key feature:** Page refresh loads token from localStorage → user stays logged in.

---

### Axios Interceptor — Automatic Token Attachment

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Result:** Every API call automatically includes `Authorization: Bearer <token>` header. Frontend never manually manages headers.

---

### ProtectedRoute Component

```typescript
const ProtectedRoute: React.FC<{ children: ReactNode; requiredRole?: Role }> = ({ children, requiredRole }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={dashboards[role!]} replace />;
  }
  return <>{children}</>;
};
```

**Logic:**
- No token? → Redirect to `/login`
- Wrong role (e.g., student visiting `/admin/dashboard`)? → Redirect to correct dashboard

---

### Pages

**RegisterPage.tsx**
- Form fields: fullName, email, password, confirmPassword, role dropdown
- On role select = INSTRUCTOR or ADMIN: yellow warning "Pending admin approval"
- Submit → `authService.register()`
- Success: green box, auto-redirect to login
- Errors: red box under relevant field (per-field validation errors)

**LoginPage.tsx**
- Form fields: email, password
- Submit → `authService.login()`
- Success: call `login(response.data)` (stores token), navigate by role
- Errors: red box (401: "Invalid credentials", 403: "Account pending admin approval")

**StudentDashboard.tsx, InstructorDashboard.tsx, AdminDashboard.tsx**
- Simple header with user name
- "Log Out" button (clears localStorage, redirects to `/login`)
- Placeholder text for future sprints

---

### App.tsx Routing

```typescript
<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/student/dashboard" 
        element={<ProtectedRoute requiredRole="STUDENT"><StudentDashboard /></ProtectedRoute>} 
      />
      <Route path="/instructor/dashboard" 
        element={<ProtectedRoute requiredRole="INSTRUCTOR"><InstructorDashboard /></ProtectedRoute>} 
      />
      <Route path="/admin/dashboard" 
        element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} 
      />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

---

## Setup & Testing Instructions

### Prerequisites

- PostgreSQL 14 (running on `localhost:5432`)
- Java 17
- Node.js 18+
- Maven (or use `./mvnw`)

### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE elearning_platform;"

# Run schema
psql -U postgres -d elearning_platform -f database/schema.sql

# Run seed (admin account)
psql -U postgres -d elearning_platform -f database/seed.sql

# Verify
psql -U postgres -d elearning_platform -c "SELECT id, full_name, email, role, approved FROM users;"
```

Expected output:
```
 id |  full_name  |       email        | role  | approved
----+-------------+--------------------+-------+----------
  1 | Admin User  | oswaldkarisma27@gmail.com | ADMIN | t
```

---

### 2. Backend Setup

```bash
cd backend
mvnw spring-boot:run
```

Wait for: `Started BackendApplication in X seconds`

Backend runs on `http://localhost:8080`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`, opens browser automatically.

---

### 4. Sprint 1 Test Plan

| # | Scenario | Steps | Expected Result |
|---|---|---|---|
| 1 | Student registers | Go `/register` → fill as STUDENT → submit | Green success box, link to `/login` |
| 2 | Student logs in | `/login` → enter credentials | Land on `/student/dashboard` |
| 3 | Token persistence | On dashboard → refresh page | Still logged in (same dashboard) |
| 4 | Logout | Click "Log Out" button | Redirect to `/login`, localStorage cleared |
| 5 | Instructor pending approval | `/register` → select INSTRUCTOR → submit | Yellow warning on role select, message says "pending approval" |
| 6 | Instructor can't log in | `/login` → instructor credentials | Red box: "Your account is pending admin approval" |
| 7 | Admin seed account works | `/login` → `oswaldkarisma27@gmail.com` / `admin123` | Land on `/admin/dashboard` |
| 8 | Invalid password | `/login` → correct email, wrong password | Red box: "Invalid credentials" |
| 9 | Validation errors | `/register` → invalid email format | Red box under email field |
| 10 | Protected routes | While logged out → manually visit `/student/dashboard` | Redirect to `/login` |
| 11 | Role mismatch | Log in as student → manually visit `/admin/dashboard` | Redirect back to `/student/dashboard` |

**Test passes if all 11 scenarios work as expected.**

---

## Security Highlights

**What's Enforced:**

✅ **No plain-text passwords** — All passwords hashed with BCrypt (strength 10) before storage  
✅ **JWT tokens** — Signed, 24-hour expiration, verified on every request  
✅ **Stateless backend** — No server sessions, scales horizontally  
✅ **CORS restricted** — Only `localhost:3000` can access backend  
✅ **Unified login errors** — 401 for both "email not found" and "password wrong" (no email enumeration)  
✅ **Role enforcement** — Backend always checks role, frontend just redirects  
✅ **Protected routes** — Frontend redirects to login if no token; backend rejects requests without Bearer token  

**Environment Variables:**
- `JWT_SECRET` — Override the JWT signing key (required in production)
- Database credentials in `application.properties` (should move to env vars for production)

---

## Hard Invariants (Never Break These)

1. **passwordHash is never sent to frontend** — All DTOs exclude this field
2. **Role checks happen on backend** — Frontend redirects for UX; backend enforces policy
3. **Login error messages unified** — 401 for both email-not-found and password-wrong
4. **Approval workflow** — Students auto-approved (database trigger), Instructors/Admins require manual approval (Sprint 3)
5. **Stateless JWT** — No server sessions; token contains all info needed for authorization
6. **@Valid on all DTOs** — Validation errors return 400 with field-level details

---

## Known Limitations & Future Work

**Sprint 1 Scope (Intentionally Not Included):**

- ❌ Password reset / forgot password flow
- ❌ Email verification
- ❌ Rate limiting on auth endpoints
- ❌ Admin approval UI (comes in Sprint 3)
- ❌ Refresh token rotation
- ❌ 2FA / multi-factor authentication
- ❌ User profile editing
- ❌ Session timeout / inactivity logout

These are **out of scope** for Sprint 1 and are planned for later sprints.

---

## What's Next — Sprint 2

Sprint 2 adds **Learning**: browse courses, enroll, attend materials, create courses.

**New entities:**
- `Course` (title, description, published status, instructor)
- `CourseMaterial` (content, order_index, type)
- `Enrollment` (student ↔ course, active/dropped status)

**New endpoints:**
- GET `/api/courses` — List all published courses
- POST `/api/courses` — Create course (instructor only)
- POST `/api/enrollments` — Enroll in course (student only)
- DELETE `/api/enrollments/{courseId}` — Drop course
- GET `/api/enrollments/my-courses` — Student's enrolled courses

**New UI:**
- Course grid (search, filter, browse)
- Course detail page (enroll/attend/drop buttons)
- Instructor course management
- Material viewing

---

## Files Changed in This Sprint

**Backend (Java):**
- `backend/src/main/java/com/elearning/backend/entity/` — User, Student, Instructor, Admin, Role
- `backend/src/main/java/com/elearning/backend/service/AuthService.java` — register & login logic
- `backend/src/main/java/com/elearning/backend/controller/AuthController.java` — HTTP endpoints
- `backend/src/main/java/com/elearning/backend/security/` — JwtUtil, JwtFilter, SecurityConfig
- `backend/src/main/java/com/elearning/backend/repository/UserRepository.java` — DB queries
- `backend/src/main/java/com/elearning/backend/exception/` — Custom exceptions & handler
- `backend/src/main/java/com/elearning/backend/dto/` — Request/response DTOs
- `backend/pom.xml` — Dependencies (Spring Boot 4.0.6, JJWT, BCrypt, PostgreSQL)
- `backend/src/main/resources/application.properties` — Config (JWT secret, DB URL)

**Database (PostgreSQL):**
- `database/schema.sql` — users table, trigger, indexes
- `database/seed.sql` — admin seed account

**Frontend (React + TypeScript):**
- `frontend/src/types/index.ts` — Type definitions
- `frontend/src/services/api.ts` — Axios + auth API
- `frontend/src/context/AuthContext.tsx` — Global auth state
- `frontend/src/components/ProtectedRoute.tsx` — Route protection
- `frontend/src/pages/RegisterPage.tsx`, `LoginPage.tsx`, `*Dashboard.tsx`
- `frontend/src/App.jsx` — React Router setup
- `frontend/package.json` — Dependencies (React 18, Axios, React Router 6)
- `frontend/tsconfig.json`, `tsconfig.node.json` — TypeScript config

---

## Git Workflow for Sprint 1 PR

```bash
# Create feature branch
git checkout -b feat/sprint1-auth

# Stage all changes
git add backend/ frontend/ database/

# Commit
git commit -m "feat(auth): Sprint 1 — register, login, JWT, auth context, protected routes"

# Push to remote
git push origin feat/sprint1-auth

# Open PR into dev branch on GitHub
# Merge after code review
```

---

## Team Notes

**For Frontend Team (Sprint 2):**
- AuthContext is ready to use. Call `const { token, role, userId, fullName, login, logout, isAuthenticated } = useAuth()`
- API interceptor auto-attaches Bearer token. Use `authService` and `api` directly.
- New endpoints should extend `authService` in `src/services/api.ts`

**For Backend Team (Sprint 2):**
- All auth is complete. Focus on Course/Enrollment entities.
- Keep same exception hierarchy and @Valid approach.
- Remember: role checks in service (@PreAuthorize on controller if needed), not in business logic.

**For Database Team (Sprint 2):**
- Schema is stable. Add courses, course_materials, enrollments tables.
- Keep single-table inheritance pattern for future entity hierarchies.

---

## Verification Checklist

Before closing Sprint 1:

- [ ] Database setup runs without errors
- [ ] Backend compiles (`mvnw compile` → BUILD SUCCESS)
- [ ] Backend starts (`mvnw spring-boot:run` → "Started BackendApplication")
- [ ] Frontend installs (`npm install` → no errors)
- [ ] Frontend starts (`npm run dev` → opens on localhost:3000)
- [ ] All 11 test scenarios pass
- [ ] localStorage persists token across refresh
- [ ] Admin seed account works
- [ ] No password_hash in API responses
- [ ] All tests on dev branch pass CI/CD
- [ ] Code review approved
- [ ] PR merged to dev

---

**Sprint 1 Status: ✅ READY FOR TESTING**

Contact: osvald-27 (GitHub) | University of Buea, CEF331
