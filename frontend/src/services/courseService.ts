import { api } from './api';
import { Course, EnrollmentStatus } from '../types';

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getCourses = (token: string) =>
  api.get<Course[]>('/courses', authHeader(token));

export const getCourse = (id: number, token: string) =>
  api.get<Course>(`/courses/${id}`, authHeader(token));

export const getEnrollmentStatus = (courseId: number, token: string) =>
  api.get<EnrollmentStatus>(`/enrollments/status/${courseId}`, authHeader(token));

export const enrollCourse = (courseId: number, token: string) =>
  api.post<{ message: string }>('/enrollments', { courseId }, authHeader(token));

export const dropCourse = (courseId: number, token: string) =>
  api.delete<{ message: string }>(`/enrollments/${courseId}`, authHeader(token));

