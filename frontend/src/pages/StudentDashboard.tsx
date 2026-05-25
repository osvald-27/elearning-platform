import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService, enrollmentService } from '../services/api';
import type { CourseResponse, EnrollmentResponse } from '../types';
import { AxiosError } from 'axios';
import Sidebar from '../components/Sidebar';

export default function StudentDashboard() {
  const { fullName, logout } = useAuth();
  const navigate = useNavigate();
  const [courses,     setCourses]     = useState<CourseResponse[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    Promise.all([courseService.getAll(), enrollmentService.getMyCourses()])
      .then(([cr, er]) => { setCourses(cr.data); setEnrollments(er.data); })
      .catch((e: AxiosError<{error?:string}>) => setError(e.response?.data?.error ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const enrolledIds = new Set(enrollments.map(e => e.courseId));
  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.instructorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="page inner-page" style={{ paddingTop: 0 }}>
      <Sidebar />
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-heading">My Learning</h1>
          <p className="dashboard-sub">Welcome back, {fullName} 👋</p>
        </div>
        <button className="secondary-btn btn-sm"
          style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} onClick={logout}>Log Out</button>
      </div>

      {enrollments.length > 0 && (
        <div style={{ maxWidth: 'var(--max-width)', margin: '24px auto 0' }}>
          <h2 style={{ fontFamily: "'Carter One', cursive", margin: '0 0 12px', fontSize: 22 }}>My Courses</h2>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {enrollments.map(e => (
              <div key={e.enrollmentId} onClick={() => navigate(`/courses/${e.courseId}`)}
                style={{ minWidth: 190, background: '#fff', borderRadius: 20, padding: 16,
                  boxShadow: 'var(--card-shadow)', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📖</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{e.courseTitle}</div>
                <div style={{ fontSize: 11, color: 'var(--gray)' }}>{e.instructorName}</div>
                <div style={{ marginTop: 10, height: 4, background: '#e0e0e0', borderRadius: 2 }}>
                  <div style={{ width: `${e.progressPercent}%`, height: '100%', background: 'var(--green)', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 3 }}>{e.progressPercent}% complete</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="search-bar"><input placeholder="Search courses or instructors..."
        value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div style={{ maxWidth: 'var(--max-width)', margin: '16px auto 0' }}>
        <h2 style={{ fontFamily: "'Carter One', cursive", margin: 0, fontSize: 22 }}>
          All Courses <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: 'var(--gray)' }}>({filtered.length})</span>
        </h2>
      </div>

      {loading && <div className="loading-wrap"><div className="loading-spinner" /><span>Loading...</span></div>}
      {error   && <div style={{ maxWidth: 'var(--max-width)', margin: '14px auto' }}><div className="alert alert-error">{error}</div></div>}

      {!loading && !error && (
        <section className="card-grid">
          {filtered.length === 0
            ? <div className="empty-wrap" style={{ gridColumn: '1/-1' }}>No courses match your search.</div>
            : filtered.map(course => (
              <article key={course.id} className="course-card" onClick={() => navigate(`/courses/${course.id}`)}>
                <div className="card-img-wrap" style={{ position: 'relative' }}>
                  {course.imageUrl ? <img src={course.imageUrl} alt={course.title} />
                    : <span className="card-img-placeholder">📚</span>}
                  {enrolledIds.has(course.id) && (
                    <span className="badge badge-green" style={{ position: 'absolute', top: 8, right: 8 }}>✓ Enrolled</span>
                  )}
                </div>
                <h2>{course.title}</h2>
                <p style={{ fontSize: 12, color: 'var(--gray)', margin: '0 0 2px' }}>{course.instructorName}</p>
                <p>{(course.description ?? '').substring(0, 80)}{(course.description?.length ?? 0) > 80 ? '...' : ''}</p>
                <button className="primary-btn btn-sm" style={{ alignSelf: 'flex-start' }}>View Course</button>
              </article>
            ))}
        </section>
      )}
    </main>
  );
}
