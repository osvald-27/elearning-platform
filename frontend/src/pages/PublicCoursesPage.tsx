import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { CourseResponse } from '../types';
import { AxiosError } from 'axios';
import Sidebar from '../components/Sidebar';

export default function PublicCoursesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (token) {
      courseService.getAll()
        .then(r => setCourses(r.data))
        .catch((e: AxiosError<{error?:string}>) => setError(e.response?.data?.error ?? 'Failed to load courses'))
        .finally(() => setLoading(false));
    } else {
      // Show static preview for unauthenticated users
      setCourses([]);
      setLoading(false);
    }
  }, [token]);

  return (
    <main className="page inner-page">
      <Sidebar />
      <header className="site-header">
        <Link to="/" className="logo-link">
          <img src="/logo.png" alt="Fold logo" className="site-logo" />
        </Link>
      </header>

      <section className="page-hero compact">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="section-text">Choose a learning path that matches your goals.</p>
        </div>
      </section>

      {!token && (
        <div style={{ maxWidth: 'var(--max-width)', margin: '20px auto' }}>
          <div className="alert alert-warning">
            <strong>Sign in to view and enroll in courses.</strong>{' '}
            <Link to="/login" style={{ color: 'var(--green-dark)', fontWeight: 700 }}>Login</Link>
            {' '}or{' '}
            <Link to="/get-started" style={{ color: 'var(--green-dark)', fontWeight: 700 }}>Sign up free</Link>
          </div>
          {/* Static preview cards */}
          <section className="card-grid">
            {[
              { icon: '/book.svg', title: 'Programming Fundamentals', desc: 'Learn the basics of programming with hands-on examples.' },
              { icon: '/pencil.svg', title: 'UI Design Essentials', desc: 'Layout, typography, spacing, and interface design.' },
              { icon: '/briefcase.svg', title: 'Career Readiness', desc: 'Portfolio building, projects, and interview preparation.' },
            ].map((c, i) => (
              <article key={i} className="course-card" onClick={() => navigate('/get-started')}>
                <div className="card-img-wrap">
                  <img src={c.icon} alt={c.title} style={{ width: 80, height: 80, objectFit: 'contain' }} />
                </div>
                <h2>{c.title}</h2>
                <p>{c.desc}</p>
                <Link to="/get-started" className="primary-btn" style={{ alignSelf: 'flex-start' }}>View Course</Link>
              </article>
            ))}
          </section>
        </div>
      )}

      {token && loading && (
        <div className="loading-wrap"><div className="loading-spinner" /><span>Loading courses...</span></div>
      )}
      {token && error && (
        <div style={{ maxWidth: 'var(--max-width)', margin: '20px auto' }}>
          <div className="alert alert-error">{error}</div>
        </div>
      )}
      {token && !loading && !error && (
        <section className="card-grid">
          {courses.length === 0 ? (
            <div className="empty-wrap" style={{ gridColumn: '1/-1' }}>No courses available yet.</div>
          ) : courses.map(course => (
            <article key={course.id} className="course-card" onClick={() => navigate(`/courses/${course.id}`)}>
              <div className="card-img-wrap">
                {course.imageUrl
                  ? <img src={course.imageUrl} alt={course.title} />
                  : <span className="card-img-placeholder">📚</span>
                }
              </div>
              <h2>{course.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--gray)' }}>{course.instructorName}</p>
              <p>{course.description?.substring(0, 80)}{(course.description?.length ?? 0) > 80 ? '...' : ''}</p>
              <button className="primary-btn" style={{ alignSelf: 'flex-start' }}>View Course</button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
