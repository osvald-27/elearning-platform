import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/api';
import type { CourseResponse, CreateCourseRequest } from '../types';
import { AxiosError } from 'axios';

export default function InstructorDashboard() {
  const { fullName, logout } = useAuth();

  const [courses,    setCourses]    = useState<CourseResponse[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message,    setMessage]    = useState('');
  const [error,      setError]      = useState('');

  const [form, setForm] = useState<CreateCourseRequest>({
    title: '', description: '', imageUrl: '',
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await courseService.getMyCourses();
      setCourses(res.data);
    } catch (err) {
      const e = err as AxiosError<{ error?: string }>;
      setError(e.response?.data?.error ?? 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSubmitting(true); setError(''); setMessage('');
    try {
      const res = await courseService.create(form);
      setCourses(prev => [res.data, ...prev]);
      setMessage(`"${res.data.title}" created as a draft.`);
      setForm({ title: '', description: '', imageUrl: '' });
      setShowForm(false);
    } catch (err) {
      const e = err as AxiosError<{ error?: string }>;
      setError(e.response?.data?.error ?? 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (courseId: number, title: string) => {
    if (!window.confirm(`Publish "${title}"? Students will be able to see it.`)) return;
    try {
      const res = await courseService.publish(courseId);
      setCourses(prev => prev.map(c => c.id === courseId ? res.data : c));
      setMessage(`"${title}" is now published.`);
    } catch (err) {
      const e = err as AxiosError<{ error?: string }>;
      setError(e.response?.data?.error ?? 'Failed to publish');
    }
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.heading}>Instructor Dashboard</h1>
          <p style={s.sub}>Welcome, {fullName} 👋</p>
        </div>
        <div style={s.headerActions}>
          <button style={s.createBtn} onClick={() => { setShowForm(v => !v); setError(''); setMessage(''); }}>
            {showForm ? '✕ Cancel' : '+ New Course'}
          </button>
          <button style={s.logoutBtn} onClick={logout}>Log Out</button>
        </div>
      </div>

      <div style={s.container}>
        {/* Feedback */}
        {message && <div style={s.successBox}>{message}</div>}
        {error   && <div style={s.errorBox}>{error}</div>}

        {/* Create Course Form */}
        {showForm && (
          <div style={s.formCard}>
            <h2 style={s.formTitle}>Create New Course</h2>
            <p style={s.formNote}>New courses start as drafts — students cannot see them until you publish.</p>

            <div style={s.field}>
              <label style={s.label}>Title *</label>
              <input style={s.input} value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Introduction to Python" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={s.textarea} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What will students learn?" rows={4} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Image URL</label>
              <input style={s.input} value={form.imageUrl}
                onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                placeholder="https://..." />
            </div>
            <button style={s.submitBtn} onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        )}

        {/* Course List */}
        <h2 style={s.sectionTitle}>My Courses ({courses.length})</h2>

        {loading && <p style={s.center}>Loading your courses...</p>}

        {!loading && courses.length === 0 && (
          <div style={s.empty}>
            <p>You haven't created any courses yet.</p>
            <button style={s.createBtn} onClick={() => setShowForm(true)}>Create Your First Course</button>
          </div>
        )}

        <div style={s.courseList}>
          {courses.map(course => (
            <div key={course.id} style={s.courseCard}>
              {course.imageUrl && (
                <img src={course.imageUrl} alt={course.title} style={s.courseImg} />
              )}
              <div style={s.courseInfo}>
                <div style={s.courseTop}>
                  <h3 style={s.courseTitle}>{course.title}</h3>
                  <span style={course.published ? s.badgePublished : s.badgeDraft}>
                    {course.published ? '✓ Published' : 'Draft'}
                  </span>
                </div>
                <p style={s.courseDesc}>
                  {course.description
                    ? course.description.substring(0, 100) + (course.description.length > 100 ? '...' : '')
                    : 'No description'}
                </p>
                <div style={s.courseActions}>
                  {!course.published && (
                    <button style={s.publishBtn}
                      onClick={() => handlePublish(course.id, course.title)}>
                      Publish
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:           { minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '3rem' },
  header:         { backgroundColor: '#1a1a2e', color: '#fff', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  heading:        { margin: 0, fontSize: '1.4rem', fontWeight: 700 },
  sub:            { margin: '0.2rem 0 0', fontSize: '0.875rem', opacity: 0.8 },
  headerActions:  { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  createBtn:      { background: '#e8a020', color: '#fff', border: 'none', padding: '0.5rem 1.1rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' },
  logoutBtn:      { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 600 },
  container:      { maxWidth: '860px', margin: '0 auto', padding: '1.5rem' },
  formCard:       { background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1.5rem' },
  formTitle:      { margin: '0 0 0.3rem', fontSize: '1.15rem', fontWeight: 700, color: '#1a1a2e' },
  formNote:       { margin: '0 0 1.25rem', color: '#888', fontSize: '0.85rem' },
  field:          { marginBottom: '1rem' },
  label:          { display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#333', marginBottom: '0.3rem' },
  input:          { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '5px', fontSize: '0.95rem', boxSizing: 'border-box' },
  textarea:       { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '5px', fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  submitBtn:      { background: '#1a1a2e', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '5px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  sectionTitle:   { fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '1rem' },
  courseList:     { display: 'flex', flexDirection: 'column', gap: '1rem' },
  courseCard:     { background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', overflow: 'hidden' },
  courseImg:      { width: '160px', objectFit: 'cover', flexShrink: 0 },
  courseInfo:     { padding: '1.1rem 1.25rem', flex: 1 },
  courseTop:      { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' },
  courseTitle:    { margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a1a2e' },
  badgePublished: { fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '20px', background: '#e8f5e9', color: '#2e7d32' },
  badgeDraft:     { fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '20px', background: '#fff3e0', color: '#e65100' },
  courseDesc:     { margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#666' },
  courseActions:  { display: 'flex', gap: '0.5rem' },
  publishBtn:     { background: '#27ae60', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' },
  successBox:     { background: '#e8f5e9', border: '1px solid #66bb6a', borderRadius: '5px', padding: '0.75rem', marginBottom: '1rem', color: '#2e7d32', fontSize: '0.875rem' },
  errorBox:       { background: '#fdecea', border: '1px solid #e57373', borderRadius: '5px', padding: '0.75rem', marginBottom: '1rem', color: '#c0392b', fontSize: '0.875rem' },
  empty:          { background: '#fff', borderRadius: '8px', padding: '2rem', textAlign: 'center', color: '#888' },
  center:         { textAlign: 'center', color: '#888' },
};
