import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, enrollmentService } from '../services/api';
import type { CourseDetailResponse } from '../types';
import { AxiosError } from 'axios';
import Sidebar from '../components/Sidebar';

export default function CourseAttendPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courseId = Number(id);
  const [course,  setCourse]  = useState<CourseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const statusRes = await enrollmentService.getStatus(courseId);
        if (!statusRes.data.enrolled || statusRes.data.status !== 'ACTIVE') {
          navigate(`/courses/${courseId}`, { replace: true }); return;
        }
        const courseRes = await courseService.attend(courseId);
        setCourse(courseRes.data);
      } catch (e) {
        const err = e as AxiosError<{error?:string}>;
        if (err.response?.status === 403) { navigate(`/courses/${courseId}`, { replace: true }); return; }
        setError(err.response?.data?.error ?? 'Failed to load materials');
      } finally { setLoading(false); }
    };
    load();
  }, [courseId, navigate]);

  if (loading) return <div className="loading-wrap" style={{ minHeight: '100vh' }}><div className="loading-spinner" /><span>Loading materials...</span></div>;
  if (error)   return <div className="empty-wrap" style={{ minHeight: '100vh' }}><div className="alert alert-error">{error}</div></div>;
  if (!course) return null;

  const typeStyle = (t: string): CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
    borderRadius: 999, fontSize: 10, fontWeight: 700, marginRight: 8,
    background: t === 'VIDEO' ? '#e3f2fd' : t === 'FILE' ? '#fce4ec' : t === 'LINK' ? '#fff8e1' : 'var(--green-light)',
    color:      t === 'VIDEO' ? '#1565c0' : t === 'FILE' ? '#880e4f' : t === 'LINK' ? '#e65100' : '#2e7d32',
  });

  return (
    <main className="page inner-page">
      <Sidebar />

      <div style={{ maxWidth: 'var(--max-width)', margin: '16px auto 0', background: 'var(--black)',
        color: '#fff', borderRadius: 'var(--radius-xl)', padding: '20px 28px' }}>
        <button className="back-btn" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}
          onClick={() => navigate(`/courses/${courseId}`)}>← Back to Course</button>
        <h1 style={{ fontFamily: "'Carter One', cursive", margin: '0 0 4px', fontSize: 'clamp(22px,3vw,36px)' }}>{course.title}</h1>
        <p style={{ margin: 0, opacity: 0.7, fontSize: 13 }}>By {course.instructorName}</p>
      </div>

      <div style={{ maxWidth: 'var(--max-width)', margin: '20px auto 0' }}>
        {course.materials.length === 0
          ? <div className="empty-wrap"><p>No materials have been added yet.</p></div>
          : course.materials.map((m, i) => (
            <div key={m.id} className="material-card">
              <div className="material-header">
                <span className="material-num">{i + 1}</span>
                <span style={typeStyle(m.materialType)}>{m.materialType}</span>
                <h3 className="material-title">{m.title}</h3>
              </div>
              <div className="material-body">
                {m.materialType === 'TEXT' && m.content && (
                  <p className="material-text">{m.content}</p>
                )}
                {m.materialType === 'VIDEO' && m.contentUrl && (
                  <a href={m.contentUrl} target="_blank" rel="noreferrer" className="material-link">
                    ▶ Watch Video
                  </a>
                )}
                {m.materialType === 'FILE' && m.contentUrl && (
                  <a href={m.contentUrl} target="_blank" rel="noreferrer" className="material-link">
                    📄 Download File
                  </a>
                )}
                {m.materialType === 'LINK' && m.contentUrl && (
                  <a href={m.contentUrl} target="_blank" rel="noreferrer" className="material-link">
                    🔗 Open Link
                  </a>
                )}
              </div>
            </div>
          ))}
      </div>
    </main>
  );
}
