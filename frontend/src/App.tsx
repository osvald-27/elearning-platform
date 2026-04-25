import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages (you'll create these files next)
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import StudentDashboard from './pages/StudentDashboard.tsx';
import CourseDetailPage from './pages/CourseDetailPage.tsx';

// Context
import { AuthProvider } from './context/AuthContext.ts';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                    element={<Navigate to="/login" />} />
          <Route path="/login"               element={<LoginPage />} />
          <Route path="/register"            element={<RegisterPage />} />
          <Route path="/student/dashboard"   element={<StudentDashboard />} />
          <Route path="/course/:id"          element={<CourseDetailPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;
