import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import RegisterPage      from './pages/RegisterPage';
import LoginPage         from './pages/LoginPage';

// Student pages
import StudentDashboard  from './pages/StudentDashboard';
import CourseDetailPage  from './pages/CourseDetailPage';
import CourseAttendPage  from './pages/CourseAttendPage';

// Instructor pages
import InstructorDashboard from './pages/InstructorDashboard';

// Admin page (stub — Sprint 3)
import AdminDashboard    from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login"    element={<LoginPage />} />

          {/* Student routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute role="STUDENT"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/courses/:id" element={
            <ProtectedRoute role="STUDENT"><CourseDetailPage /></ProtectedRoute>
          } />
          <Route path="/courses/:id/attend" element={
            <ProtectedRoute role="STUDENT"><CourseAttendPage /></ProtectedRoute>
          } />

          {/* Instructor routes */}
          <Route path="/instructor/dashboard" element={
            <ProtectedRoute role="INSTRUCTOR"><InstructorDashboard /></ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />

          {/* Default */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
