import axios from 'axios';
import type { LoginRequest, LoginResponse, MessageResponse, RegisterRequest } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (data: RegisterRequest) =>
    api.post<MessageResponse>('/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),
};

export const courseService = {};
export const enrollmentService = {};
export const quizService = {};
export const adminService = {};
