import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/api';
import type { CourseResponse, CreateCourseRequest } from '../types';
import { AxiosError } from 'axios';
import Sidebar from '../components/Sidebar';

export default function InstructorDashboard() {
  const { fullName, logout } = useAuth();
  const [courses,    setCourses]    = useState<CourseResponse[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message,    setMessage]    = useState('');
  const [error,      setError]      = useState('');
  const [form, setForm] = useState<CreateCourseRequest>({ title: '', description: '', imageUrl: '' });

  useEffect(() => {
    courseService.getMyCourses()
      .then(r => setCourses(r.data))
      .catch((e: AxiosError<{error?:string}>) => setError(e.response?.data?.error ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSubmitting(true); setError(''); setMessage('');
    try {
      const res = await courseService.create(form);
      setCourses(p => [res.data, ...p]);
      setMessage(`"${res.data.title}" created as a draft.`);
      setForm({ title: '', description: '', imageUrl: '' });
      setShowForm(false);
    } catch (e) {
      const err = e as AxiosError<{error?:string}>;
      setError(err.response?.data?.error ?? 'Failed to create course');
    } finally { setSubmitting(false); }
  };

  const handlePublish = async (courseId: number, title: string) => {
    if (!window.confirm(`Publish "${title}"? Students will see it.`)) return;
    try {
      const res = await courseService.publish(courseId);
      setCourses(p => p.map(c => c.id === courseId ? res.data : c));
      setMessage(`"${title}" is now published.`);
    } catch (e) {
      const err = e as AxiosError<{error?:string}>;
      setError(err.response?.data?.error ?? 'Failed to publish');
    }
  };

  return (
    <main className="page inner-page" style={{ paddingTop: 0 }}>
      <Sidebar />
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-heading">Instructor Dashboard</h1>
          <p className="dashboard-sub">Welcome, {fullName} 👋</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="primary-btn btn-sm" style={{ background: 'var(--yellow)', color: '#000' }}
            onClick={() => { setShowForm(v => !v); setError(''); setMessage(''); }}>
            {showForm ? '✕ Cancel' : '+ New Course'}
          </button>
          <button className="secondary-btn btn-sm"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} onClick={logout}>Log Out</button>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--max-width)', margin: '20px auto 0' }}>
        {message && <div className="alert alert-success">{message}</div>}
        {error   && <div className="alert alert-error">{error}</div>}

        {showForm && (
          <div className="form-card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Carter One', cursive", margin: '0 0 4px', fontSize: 22 }}>Create New Course</h2>
            <p style={{ margin: '0 0 16px', color: 'var(--gray)', fontSize: 13 }}>
              New courses start as drafts — students cannot see them until you publish.
            </p>
            <form className="site-form" onSubmit={handleCreate}>
              <label><span>Title *</span>
                <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                  placeholder="e.g. Introduction to Python" /></label>
              <label><span>Description</span>
                <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  placeholder="What will students learn?" /></label>
              <label><span>Image URL</span>
                <input value={form.imageUrl} onChange={e => setForm(p => ({...p, imageUrl: e.target.value}))}
                  placeholder="https://..." /></label>
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Course'}
              </button>
            </form>
          </div>
        )}

        <h2 style={{ fontFamily: "'Carter One', cursive", margin: '0 0 14px', fontSize: 22 }}>
          My Courses ({courses.length})
        </h2>

        {loading && <div className="loading-wrap"><div className="loading-spinner" /><span>Loading...</span></div>}

        {!loading && courses.length === 0 && (
          <div className="empty-wrap">
            <p>You haven't created any courses yet.</p>
            <button className="primary-btn" onClick={() => setShowForm(true)}>Create Your First Course</button>
          </div>
        )}

        {!loading && courses.map(course => (
          <div key={course.id} style={{ background: '#fff', borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--card-shadow)', display: 'flex', overflow: 'hidden', marginBottom: 14 }}>
            {course.imageUrl && (
              <img src={course.imageUrl} alt={course.title}
                style={{ width: 150, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ padding: '20px 24px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{course.title}</h3>
                <span className={`badge ${course.published ? 'badge-green' : 'badge-yellow'}`}>
                  {course.published ? '✓ Published' : 'Draft'}
                </span>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--gray)' }}>
                {(course.description ?? '').substring(0, 100)}{(course.description?.length ?? 0) > 100 ? '...' : ''}
              </p>
              {!course.published && (
                <button className="primary-btn btn-sm" style={{ background: 'var(--green-dark)', color: '#fff' }}
                  onClick={() => handlePublish(course.id, course.title)}>Publish</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
