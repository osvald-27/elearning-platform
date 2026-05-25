import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, enrollmentService } from '../services/api';
import type { CourseDetailResponse, EnrollmentStatusResponse } from '../types';
import { AxiosError } from 'axios';
import Sidebar from '../components/Sidebar';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courseId = Number(id);

  const [course,  setCourse]  = useState<CourseDetailResponse | null>(null);
  const [status,  setStatus]  = useState<EnrollmentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);
  const [message, setMessage] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    Promise.all([courseService.getOne(courseId), enrollmentService.getStatus(courseId)])
      .then(([cr, sr]) => { setCourse(cr.data); setStatus(sr.data); })
      .catch((e: AxiosError<{error?:string}>) => setError(e.response?.data?.error ?? 'Failed to load course'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleEnroll = async () => {
    setActing(true); setMessage(''); setError('');
    try {
      const r = await enrollmentService.enroll(courseId);
      setMessage(r.data.message);
      setStatus({ enrolled: true, status: 'ACTIVE', progressPercent: 0 });
    } catch (e) {
      const err = e as AxiosError<{error?:string}>;
      setError(err.response?.data?.error ?? 'Enrollment failed');
    } finally { setActing(false); }
  };

  const handleDrop = async () => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;
    setActing(true); setMessage(''); setError('');
    try {
      const r = await enrollmentService.drop(courseId);
      setMessage(r.data.message);
      setStatus(p => p ? { ...p, status: 'DROPPED' } : p);
    } catch (e) {
      const err = e as AxiosError<{error?:string}>;
      setError(err.response?.data?.error ?? 'Failed to drop course');
    } finally { setActing(false); }
  };

  if (loading) return <div className="loading-wrap" style={{ minHeight: '100vh' }}><div className="loading-spinner" /><span>Loading course...</span></div>;
  if (!course) return <div className="empty-wrap" style={{ minHeight: '100vh' }}><div className="alert alert-error">{error || 'Course not found'}</div></div>;

  const isActive  = status?.enrolled && status.status === 'ACTIVE';
  const isDropped = status?.enrolled && status.status === 'DROPPED';

  const typeColor = (t: string) => ({
    background: t === 'VIDEO' ? '#e3f2fd' : t === 'FILE' ? '#fce4ec' : t === 'LINK' ? '#fff8e1' : 'var(--green-light)',
    color:      t === 'VIDEO' ? '#1565c0' : t === 'FILE' ? '#880e4f' : t === 'LINK' ? '#e65100' : '#2e7d32',
  });

  return (
    <main className="page inner-page">
      <Sidebar />
      <header className="site-header" style={{ justifyContent: 'flex-start', paddingLeft: 0 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      </header>

      {course.imageUrl && (
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto 0', borderRadius: 24, overflow: 'hidden', height: 220 }}>
          <img src={course.imageUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <section className="course-info-layout">
        <div className="course-info-main">
          <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: 28, boxShadow: 'var(--card-shadow)' }}>
            <h1 className="page-title" style={{ fontSize: 'clamp(28px,4vw,52px)', marginBottom: 6 }}>{course.title}</h1>
            <p style={{ color: 'var(--gray)', fontSize: 14, margin: '0 0 12px' }}>By {course.instructorName}</p>
            <p style={{ lineHeight: 1.7, color: '#444', margin: '0 0 20px' }}>{course.description}</p>

            {message && <div className="alert alert-success">{message}</div>}
            {error   && <div className="alert alert-error">{error}</div>}

            <div className="hero-actions">
              {!status?.enrolled && (
                <button className="primary-btn" onClick={handleEnroll} disabled={acting}>
                  {acting ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
              {isActive && (
                <>
                  <button className="primary-btn" style={{ background: 'var(--green-dark)' }}
                    onClick={() => navigate(`/courses/${courseId}/attend`)}>Attend Course</button>
                  <button className="danger-btn" onClick={handleDrop} disabled={acting}>
                    {acting ? 'Dropping...' : 'Drop Course'}
                  </button>
                </>
              )}
              {isDropped && (
                <button className="primary-btn" onClick={handleEnroll} disabled={acting}>
                  {acting ? 'Re-enrolling...' : 'Re-enroll'}
                </button>
              )}
            </div>
          </div>

          {/* Materials preview */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: 28, boxShadow: 'var(--card-shadow)' }}>
            <h2 style={{ fontFamily: "'Carter One', cursive", margin: '0 0 16px', fontSize: 22 }}>
              Course Materials ({course.materials.length})
            </h2>
            {course.materials.length === 0
              ? <p style={{ color: 'var(--gray)', fontSize: 14 }}>No materials added yet.</p>
              : course.materials.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 0',
                  borderBottom: '1px solid #f5f5f5', gap: 10 }}>
                  <span style={{ minWidth: 26, height: 26, background: '#111', color: '#fff',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                  <span className="badge" style={{ ...typeColor(m.materialType), fontSize: 10 }}>{m.materialType}</span>
                  <span style={{ fontSize: 14, flex: 1 }}>{m.title}</span>
                  {!isActive && <span style={{ fontSize: 14 }}>🔒</span>}
                </div>
              ))
            }
            {!isActive && course.materials.length > 0 && (
              <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 10, fontStyle: 'italic' }}>
                Enroll to access all materials
              </p>
            )}
          </div>
        </div>

        <aside className="course-info-side">
          <div className="info-card">
            <div style={{ fontSize: 48 }}>📚</div>
            <p style={{ margin: 0 }}><strong>Instructor:</strong> {course.instructorName}</p>
            <p style={{ margin: 0 }}><strong>Materials:</strong> {course.materials.length} items</p>
            <p style={{ margin: 0 }}><strong>Format:</strong> Self-paced</p>
            {status?.enrolled && (
              <div className="badge badge-green" style={{ marginTop: 6 }}>
                {status.status === 'ACTIVE' ? '✓ Enrolled' : 'Dropped'}
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
