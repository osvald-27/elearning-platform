import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService, enrollmentService } from '../services/api';
import type { CourseResponse, EnrollmentResponse } from '../types';
import { AxiosError } from 'axios';

export default function StudentDashboard() {
  const { fullName, logout } = useAuth();
  const navigate = useNavigate();

  const [courses,     setCourses]     = useState<CourseResponse[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesRes, enrollRes] = await Promise.all([
          courseService.getAll(),
          enrollmentService.getMyCourses(),
        ]);
        setCourses(coursesRes.data);
        setEnrollments(enrollRes.data);
      } catch (err) {
        const e = err as AxiosError<{ error?: string }>;
        setError(e.response?.data?.error ?? 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const enrolledIds = new Set(enrollments.map(e => e.courseId));

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.instructorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.heading}>UB E-Learning</h1>
          <p style={s.sub}>Welcome back, {fullName} 👋</p>
        </div>
        <button style={s.logoutBtn} onClick={logout}>Log Out</button>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <input
          style={s.search}
          placeholder="Search courses or instructors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* States */}
      {loading && <p style={s.center}>Loading courses...</p>}
      {error   && <div style={s.errorBox}>{error}</div>}

      {/* Grid */}
      {!loading && !error && (
        <>
          <p style={s.count}>{filtered.length} course{filtered.length !== 1 ? 's' : ''} available</p>
          <div style={s.grid}>
            {filtered.map(course => (
              <div key={course.id} style={s.card} onClick={() => navigate(`/courses/${course.id}`)}>
                {/* Image */}
                <div style={s.imgWrap}>
                  {course.imageUrl
                    ? <img src={course.imageUrl} alt={course.title} style={s.img} />
                    : <div style={s.imgPlaceholder}>📚</div>
                  }
                  {enrolledIds.has(course.id) && (
                    <span style={s.badge}>✓ Enrolled</span>
                  )}
                </div>
                {/* Info */}
                <div style={s.cardBody}>
                  <h3 style={s.cardTitle}>{course.title}</h3>
                  <p style={s.cardInstructor}>{course.instructorName}</p>
                  <p style={s.cardDesc}>
                    {course.description
                      ? course.description.substring(0, 80) + (course.description.length > 80 ? '...' : '')
                      : 'No description available'}
                  </p>
                  <button style={s.viewBtn}>View Course →</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p style={s.center}>No courses match your search.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:          { minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '0 0 3rem' },
  header:        { backgroundColor: '#1a1a2e', color: '#fff', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  heading:       { margin: 0, fontSize: '1.4rem', fontWeight: 700 },
  sub:           { margin: '0.2rem 0 0', fontSize: '0.875rem', opacity: 0.8 },
  logoutBtn:     { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 600 },
  searchWrap:    { padding: '1.5rem 2rem 0' },
  search:        { width: '100%', maxWidth: '480px', padding: '0.65rem 1rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem', boxSizing: 'border-box' },
  count:         { padding: '0.75rem 2rem 0', color: '#666', fontSize: '0.875rem' },
  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', padding: '1rem 2rem 0' },
  card:          { background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.15s', display: 'flex', flexDirection: 'column' },
  imgWrap:       { position: 'relative', height: '160px', overflow: 'hidden', backgroundColor: '#e8e8e8' },
  img:           { width: '100%', height: '100%', objectFit: 'cover' },
  imgPlaceholder:{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' },
  badge:         { position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#27ae60', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '20px' },
  cardBody:      { padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' },
  cardTitle:     { margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: '#1a1a2e' },
  cardInstructor:{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#666' },
  cardDesc:      { margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#555', flex: 1 },
  viewBtn:       { background: '#1a1a2e', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '5px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, alignSelf: 'flex-start' },
  errorBox:      { margin: '1rem 2rem', background: '#fdecea', border: '1px solid #e57373', borderRadius: '5px', padding: '0.75rem', color: '#c0392b' },
  center:        { textAlign: 'center', color: '#888', marginTop: '2rem', gridColumn: '1/-1' },
};
