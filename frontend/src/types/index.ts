export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  approved: boolean;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  instructorName: string;
  imageUrl: string;
}

export interface EnrollmentStatus {
  enrolled: boolean;
}

export interface LoginResponse {
  token: string;
  role: Role;
  userId: number;
}

export interface ApiError {
  message: string;
}
