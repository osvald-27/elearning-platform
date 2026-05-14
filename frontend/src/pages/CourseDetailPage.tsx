import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, enrollmentService } from '../services/api';
import type { CourseDetailResponse, EnrollmentStatusResponse } from '../types';
import { AxiosError } from 'axios';

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
    const load = async () => {
      try {
        const [courseRes, statusRes] = await Promise.all([
          courseService.getOne(courseId),
          enrollmentService.getStatus(courseId),
        ]);
        setCourse(courseRes.data);
        setStatus(statusRes.data);
      } catch (err) {
        const e = err as AxiosError<{ error?: string }>;
        setError(e.response?.data?.error ?? 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const handleEnroll = async () => {
    setActing(true); setMessage(''); setError('');
    try {
      const res = await enrollmentService.enroll(courseId);
      setMessage(res.data.message);
      setStatus({ enrolled: true, status: 'ACTIVE', progressPercent: 0 });
    } catch (err) {
      const e = err as AxiosError<{ error?: string }>;
      setError(e.response?.data?.error ?? 'Enrollment failed');
    } finally { setActing(false); }
  };

  const handleDrop = async () => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;
    setActing(true); setMessage(''); setError('');
    try {
      const res = await enrollmentService.drop(courseId);
      setMessage(res.data.message);
      setStatus(prev => prev ? { ...prev, status: 'DROPPED' } : prev);
    } catch (err) {
      const e = err as AxiosError<{ error?: string }>;
      setError(e.response?.data?.error ?? 'Failed to drop course');
    } finally { setActing(false); }
  };

  const handleAttend = () => navigate(`/courses/${courseId}/attend`);

  if (loading) return <div style={s.center}>Loading course...</div>;
  if (error && !course) return <div style={s.center}><div style={s.errorBox}>{error}</div></div>;
  if (!course) return null;

  const isActive  = status?.enrolled && status.status === 'ACTIVE';
  const isDropped = status?.enrolled && status.status === 'DROPPED';

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Back */}
        <button style={s.backBtn} onClick={() => navigate('/student/dashboard')}>← Back to Courses</button>

        {/* Hero */}
        {course.imageUrl && <img src={course.imageUrl} alt={course.title} style={s.heroImg} />}

        <div style={s.content}>
          <h1 style={s.title}>{course.title}</h1>
          <p style={s.instructor}>By {course.instructorName}</p>
          <p style={s.desc}>{course.description}</p>

          {/* Feedback */}
          {message && <div style={s.successBox}>{message}</div>}
          {error   && <div style={s.errorBox}>{error}</div>}

          {/* Action buttons */}
          <div style={s.actions}>
            {!status?.enrolled && (
              <button style={s.enrollBtn} onClick={handleEnroll} disabled={acting}>
                {acting ? 'Enrolling...' : 'Enroll Now'}
              </button>
            )}
            {isActive && (
              <>
                <button style={s.attendBtn} onClick={handleAttend}>Attend Course</button>
                <button style={s.dropBtn}   onClick={handleDrop} disabled={acting}>
                  {acting ? 'Dropping...' : 'Drop Course'}
                </button>
              </>
            )}
            {isDropped && (
              <button style={s.enrollBtn} onClick={handleEnroll} disabled={acting}>
                {acting ? 'Re-enrolling...' : 'Re-enroll'}
              </button>
            )}
          </div>

          {/* Materials preview */}
          <div style={s.materialsSection}>
            <h2 style={s.materialsTitle}>Course Materials ({course.materials.length})</h2>
            {course.materials.length === 0
              ? <p style={s.noMaterials}>No materials added yet.</p>
              : course.materials.map((m, i) => (
                  <div key={m.id} style={s.materialItem}>
                    <span style={s.materialIndex}>{i + 1}</span>
                    <span style={s.materialTypeTag(m.materialType)}>{m.materialType}</span>
                    <span style={s.materialTitle}>{m.title}</span>
                    {!isActive && <span style={s.locked}>🔒</span>}
                  </div>
                ))
            }
            {!isActive && course.materials.length > 0 && (
              <p style={s.lockNote}>Enroll to access all materials</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const materialTypeTag = (type: string): React.CSSProperties => ({
  fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem',
  borderRadius: '20px', marginRight: '0.5rem',
  background: type === 'VIDEO' ? '#e3f2fd' : type === 'FILE' ? '#fce4ec' : '#e8f5e9',
  color:      type === 'VIDEO' ? '#1565c0' : type === 'FILE' ? '#880e4f' : '#2e7d32',
});

const s: Record<string, any> = {
  page:            { minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '3rem' },
  container:       { maxWidth: '800px', margin: '0 auto', padding: '1.5rem' },
  backBtn:         { background: 'none', border: 'none', color: '#1a1a2e', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', padding: 0 },
  heroImg:         { width: '100%', height: '240px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1.5rem' },
  content:         { background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  title:           { margin: '0 0 0.25rem', fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e' },
  instructor:      { margin: '0 0 1rem', color: '#666', fontSize: '0.9rem' },
  desc:            { margin: '0 0 1.25rem', color: '#444', lineHeight: 1.6 },
  actions:         { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  enrollBtn:       { padding: '0.7rem 1.5rem', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  attendBtn:       { padding: '0.7rem 1.5rem', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  dropBtn:         { padding: '0.7rem 1.5rem', background: '#fff', color: '#c0392b', border: '2px solid #c0392b', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  successBox:      { background: '#e8f5e9', border: '1px solid #66bb6a', borderRadius: '5px', padding: '0.75rem', marginBottom: '1rem', color: '#2e7d32', fontSize: '0.875rem' },
  errorBox:        { background: '#fdecea', border: '1px solid #e57373', borderRadius: '5px', padding: '0.75rem', marginBottom: '1rem', color: '#c0392b', fontSize: '0.875rem' },
  materialsSection:{ borderTop: '1px solid #eee', paddingTop: '1.25rem' },
  materialsTitle:  { margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' },
  materialItem:    { display: 'flex', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #f5f5f5' },
  materialIndex:   { minWidth: '24px', height: '24px', background: '#f0f2f5', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, marginRight: '0.75rem', color: '#555' },
  materialTypeTag,
  materialTitle:   { flex: 1, fontSize: '0.9rem', color: '#333' },
  locked:          { marginLeft: '0.5rem', fontSize: '0.85rem' },
  lockNote:        { fontSize: '0.8rem', color: '#888', marginTop: '0.75rem', fontStyle: 'italic' },
  noMaterials:     { color: '#888', fontSize: '0.875rem' },
  center:          { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' },
};
