API CONTRACTS — Sprint 1

Base URL:
http://localhost:8080/api

AUTH

POST /auth/register
Request:
{
"fullName": "string",
"email": "string",
"password": "string",
"role": "STUDENT | INSTRUCTOR | ADMIN"
}

Response:
201 { "message": "User registered successfully" }
400 { "error": "Email already exists" }

---------------------------------------------------

POST /auth/login
Request:
{
"email": "string",
"password": "string"
}

Response:
200 {
"token": "jwt",
"role": "STUDENT | INSTRUCTOR | ADMIN",
"userId": number
}

401 { "error": "Invalid credentials" }
403 { "error": "Account pending admin approval" }

---------------------------------------------------

COURSES

GET /courses
Headers: Authorization: Bearer <token>

Response:
200 [
{
"id": number,
"title": "string",
"description": "string",
"instructorName": "string",
"imageUrl": "string"
}
]

401 Unauthorized

---------------------------------------------------

ENROLLMENTS

POST /enrollments
Headers: Authorization: Bearer <token>

Request:
{
"courseId": number
}

Response:
201 { "message": "Enrolled successfully" }
409 { "error": "Already enrolled" }

---------------------------------------------------

DELETE /enrollments/{courseId}
Response:
200 { "message": "Dropped successfully" }
400 { "error": "Not enrolled" }

---------------------------------------------------

GET /enrollments/status/{courseId}
Response:
200 { "enrolled": true }Commit it:
