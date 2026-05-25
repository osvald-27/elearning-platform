import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage           from './pages/HomePage';
import AboutPage          from './pages/AboutPage';
import GetStartedPage     from './pages/GetStartedPage';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import PublicCoursesPage  from './pages/PublicCoursesPage';
import CourseDetailPage   from './pages/CourseDetailPage';
import CourseAttendPage   from './pages/CourseAttendPage';
import StudentDashboard   from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard     from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"            element={<HomePage />} />
          <Route path="/about"       element={<AboutPage />} />
          <Route path="/get-started" element={<GetStartedPage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/register"    element={<RegisterPage />} />
          <Route path="/courses"     element={<PublicCoursesPage />} />

          {/* Student */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute role="STUDENT"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/courses/:id" element={
            <ProtectedRoute role="STUDENT"><CourseDetailPage /></ProtectedRoute>
          } />
          <Route path="/courses/:id/attend" element={
            <ProtectedRoute role="STUDENT"><CourseAttendPage /></ProtectedRoute>
          } />

          {/* Instructor */}
          <Route path="/instructor/dashboard" element={
            <ProtectedRoute role="INSTRUCTOR"><InstructorDashboard /></ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
