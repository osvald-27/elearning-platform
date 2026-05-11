export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface AuthState {
  token: string | null;
  role: Role | null;
  userId: number | null;
  fullName: string | null;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: Role;
  userId: number;
  fullName: string;
}

export interface MessageResponse {
  message: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string>;
}
