import axios from 'axios';
import type {
  LoginRequest, LoginResponse, MessageResponse, RegisterRequest,
  CourseResponse, CourseDetailResponse, CreateCourseRequest,
  EnrollmentResponse, EnrollmentStatusResponse, AdminUser, AdminStats
} from '../types';

const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authService = {
  register: (data: RegisterRequest) => api.post<MessageResponse>('/auth/register', data),
  login:    (data: LoginRequest)    => api.post<LoginResponse>('/auth/login', data),
};

export const courseService = {
  getAll:       ()              => api.get<CourseResponse[]>('/courses'),
  getOne:       (id: number)   => api.get<CourseDetailResponse>(`/courses/${id}`),
  attend:       (id: number)   => api.get<CourseDetailResponse>(`/courses/${id}/attend`),
  getMyCourses: ()              => api.get<CourseResponse[]>('/courses/instructor/my-courses'),
  create:       (d: CreateCourseRequest) => api.post<CourseResponse>('/courses', d),
  publish:      (id: number)   => api.patch<CourseResponse>(`/courses/${id}/publish`),
};

export const enrollmentService = {
  enroll:       (courseId: number) => api.post<MessageResponse>(`/enrollments/${courseId}`),
  drop:         (courseId: number) => api.patch<MessageResponse>(`/enrollments/${courseId}/drop`),
  getMyCourses: ()                 => api.get<EnrollmentResponse[]>('/enrollments/my-courses'),
  getStatus:    (courseId: number) => api.get<EnrollmentStatusResponse>(`/enrollments/${courseId}/status`),
};

export const adminService = {
  getPendingUsers: ()           => api.get<AdminUser[]>('/admin/pending-users'),
  getAllUsers:      ()           => api.get<AdminUser[]>('/admin/users'),
  approveUser:     (id: number) => api.patch<MessageResponse>(`/admin/users/${id}/approve`),
  rejectUser:      (id: number) => api.patch<MessageResponse>(`/admin/users/${id}/reject`),
  getStats:        ()           => api.get<AdminStats>('/admin/stats'),
};
