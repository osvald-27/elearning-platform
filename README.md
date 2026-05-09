FET E-Learning Project - Database_Sprint 1

 Overview
This is the database foundation for our group project. I've set up the tables and handled the initial data.

What I worked on:
User Roles: Created the structure for Admin, Teacher, and Student roles.
  Database Linking: Connected the courses to instructors using Foreign Keys.
The ID Skip Fix: I had an issue where pgAdmin skipped IDs 1-9. I manually mapped the data to IDs 10, 11, and 12 to make sure the teacher-course relationship actually works.
Role Correction:Fixed a bug where a student was accidentally labeled as a teacher.

Files
`V1__init_schema.sql` (Tables)
`V2__seed_data.sql` (Test Data)
