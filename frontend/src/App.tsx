import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import HomePage       from './pages/HomePage';
import AboutPage      from './pages/AboutPage';
import CoursesPage    from './pages/CoursesPage';
import CourseInfoPage from './pages/CourseInfoPage';

// Auth pages
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Protected dashboards
import StudentDashboard    from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard      from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ─────────────────────────────── */}
          <Route path="/"            element={<HomePage />}       />
          <Route path="/about"       element={<AboutPage />}      />
          <Route path="/courses"     element={<CoursesPage />}    />
          <Route path="/courses/:id" element={<CourseInfoPage />} />

          {/* ── Auth ───────────────────────────────── */}
          <Route path="/login"    element={<LoginPage />}    />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Protected dashboards ───────────────── */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute role="STUDENT"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/instructor/dashboard" element={
            <ProtectedRoute role="INSTRUCTOR"><InstructorDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />

          {/* ── Fallback ───────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
