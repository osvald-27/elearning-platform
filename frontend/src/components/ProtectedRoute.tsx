import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import type { ReactElement } from 'react';

interface Props {
  children: ReactElement;
  role: Role;
}

export default function ProtectedRoute({ children, role }: Props) {
  const { token, role: userRole, loading } = useAuth();

  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;

  if (userRole !== role) {
    const dashboards: Record<Role, string> = {
      STUDENT:    '/student/dashboard',
      INSTRUCTOR: '/instructor/dashboard',
      ADMIN:      '/admin/dashboard',
    };
    return <Navigate to={dashboards[userRole!]} replace />;
  }

  return children;
}
