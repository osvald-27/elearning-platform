import { api } from './api';
import { LoginResponse } from '../types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export const register = (data: RegisterPayload) =>
  api.post<{ message: string }>('/auth/register', data);

export const login = (email: string, password: string) =>
  api.post<LoginResponse>('/auth/login', { email, password });
