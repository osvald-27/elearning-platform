import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, enrollmentService } from '../services/api';
import type { CourseDetailResponse } from '../types';
import { AxiosError } from 'axios';

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
        // First verify enrollment status
        const statusRes = await enrollmentService.getStatus(courseId);
        if (!statusRes.data.enrolled || statusRes.data.status !== 'ACTIVE') {
          navigate(`/courses/${courseId}`, { replace: true });
          return;
        }
        // Then fetch materials via the attend endpoint
        const courseRes = await courseService.attend(courseId);
        setCourse(courseRes.data);
      } catch (err) {
        const e = err as AxiosError<{ error?: string }>;
        if (e.response?.status === 403) {
          navigate(`/courses/${courseId}`, { replace: true });
        } else {
          setError(e.response?.data?.error ?? 'Failed to load course');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, navigate]);

  if (loading) return <div style={s.center}>Loading materials...</div>;
  if (error)   return <div style={s.center}><div style={s.errorBox}>{error}</div></div>;
  if (!course) return null;

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <button style={s.backBtn} onClick={() => navigate(`/courses/${courseId}`)}>← Back to Course</button>
          <div>
            <h1 style={s.title}>{course.title}</h1>
            <p style={s.instructor}>By {course.instructorName}</p>
          </div>
        </div>

        {/* Materials */}
        <div style={s.materials}>
          {course.materials.length === 0
            ? <div style={s.empty}>No materials have been added yet.</div>
            : course.materials.map((m, i) => (
                <div key={m.id} style={s.materialCard}>
                  <div style={s.materialHeader}>
                    <span style={s.materialNum}>{i + 1}</span>
                    <span style={typeStyle(m.materialType)}>{m.materialType}</span>
                    <h3 style={s.materialTitle}>{m.title}</h3>
                  </div>

                  <div style={s.materialBody}>
                    {/* TEXT material */}
                    {m.materialType === 'TEXT' && m.content && (
                      <p style={s.textContent}>{m.content}</p>
                    )}

                    {/* VIDEO material */}
                    {m.materialType === 'VIDEO' && m.contentUrl && (
                      <div style={s.videoWrap}>
                        <span style={s.videoIcon}>▶</span>
                        <a href={m.contentUrl} target="_blank" rel="noreferrer" style={s.link}>
                          Watch Video
                        </a>
                      </div>
                    )}

                    {/* FILE material */}
                    {m.materialType === 'FILE' && m.contentUrl && (
                      <div style={s.fileWrap}>
                        <span style={s.fileIcon}>📄</span>
                        <a href={m.contentUrl} target="_blank" rel="noreferrer" style={s.link}>
                          Download File
                        </a>
                      </div>
                    )}

                    {/* LINK material */}
                    {m.materialType === 'LINK' && m.contentUrl && (
                      <div style={s.fileWrap}>
                        <span style={s.fileIcon}>🔗</span>
                        <a href={m.contentUrl} target="_blank" rel="noreferrer" style={s.link}>
                          Open Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

const typeStyle = (type: string): React.CSSProperties => ({
  fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem',
  borderRadius: '20px', marginRight: '0.5rem',
  background: type === 'VIDEO' ? '#e3f2fd' : type === 'FILE' ? '#fce4ec' : '#e8f5e9',
  color:      type === 'VIDEO' ? '#1565c0' : type === 'FILE' ? '#880e4f' : '#2e7d32',
});

const s: Record<string, React.CSSProperties> = {
  page:          { minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '3rem' },
  container:     { maxWidth: '800px', margin: '0 auto', padding: '1.5rem' },
  header:        { background: '#1a1a2e', color: '#fff', borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' },
  backBtn:       { background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', padding: 0, display: 'block' },
  title:         { margin: '0 0 0.2rem', fontSize: '1.4rem', fontWeight: 700 },
  instructor:    { margin: 0, opacity: 0.75, fontSize: '0.875rem' },
  materials:     { display: 'flex', flexDirection: 'column', gap: '1rem' },
  materialCard:  { background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' },
  materialHeader:{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f5f5f5' },
  materialNum:   { minWidth: '28px', height: '28px', background: '#1a1a2e', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, marginRight: '0.75rem' },
  materialTitle: { margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1a1a2e', flex: 1 },
  materialBody:  { padding: '1.25rem' },
  textContent:   { margin: 0, color: '#444', lineHeight: 1.7, fontSize: '0.95rem' },
  videoWrap:     { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  videoIcon:     { fontSize: '1.5rem', color: '#e53935' },
  fileWrap:      { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  fileIcon:      { fontSize: '1.4rem' },
  link:          { color: '#1a73e8', fontWeight: 600, fontSize: '0.95rem' },
  empty:         { background: '#fff', borderRadius: '8px', padding: '2rem', textAlign: 'center', color: '#888' },
  errorBox:      { background: '#fdecea', border: '1px solid #e57373', borderRadius: '5px', padding: '0.75rem', color: '#c0392b' },
  center:        { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
};
