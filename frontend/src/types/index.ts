export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface AuthState {
  token: string | null;
  role: Role | null;
  userId: number | null;
  fullName: string | null;
}

export interface RegisterRequest { fullName: string; email: string; password: string; role: Role; }
export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { token: string; role: Role; userId: number; fullName: string; }
export interface MessageResponse { message: string; }
export interface ApiError { error: string; details?: Record<string, string>; }

// Sprint 2 types
export interface CourseResponse {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  instructorName: string;
  published: boolean;
}

export interface MaterialResponse {
  id: number;
  materialType: 'TEXT' | 'VIDEO' | 'FILE' | 'LINK';
  title: string;
  content: string | null;
  contentUrl: string | null;
  orderIndex: number;
}

export interface CourseDetailResponse extends CourseResponse {
  materials: MaterialResponse[];
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  imageUrl: string;
}

export interface EnrollmentResponse {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  courseImageUrl: string | null;
  instructorName: string;
  status: 'ACTIVE' | 'DROPPED';
  progressPercent: number;
}

export interface EnrollmentStatusResponse {
  enrolled: boolean;
  status: 'ACTIVE' | 'DROPPED' | null;
  progressPercent: number | null;
}
