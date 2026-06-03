import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import type { NavItem } from '../components/DashboardShell';
import { C } from '../theme';

type Tab = 'overview' | 'courses' | 'students' | 'profile';

const NAV: NavItem[] = [
  { key: 'overview',  icon: '🏠', label: 'Overview'   },
  { key: 'courses',   icon: '📖', label: 'My Courses'  },
  { key: 'students',  icon: '🎓', label: 'Students'    },
  { key: 'profile',   icon: '👤', label: 'Profile'     },
];

export default function InstructorDashboard() {
  const { fullName, logout } = useAuth();
  const navigate             = useNavigate();
  const [tab, setTab]        = useState<Tab>('overview');

  const card: React.CSSProperties = {
    background: C.white, borderRadius: 28,
    padding: '24px', boxShadow: C.cardShadow,
  };

  const statCard = (value: string | number, label: string, icon: string, color = C.greenDark) => (
    <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color, fontFamily: "'Carter One', cursive", lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.gray, fontWeight: 600 }}>{label}</p>
      </div>
    </div>
  );

  const emptyState = (emoji: string, title: string, body: string) => (
    <div style={{ ...card, textAlign: 'center', padding: '60px 40px' }}>
      <p style={{ fontSize: 52, margin: '0 0 14px' }}>{emoji}</p>
      <h3 style={{ margin: '0 0 8px', fontFamily: "'Carter One', cursive", fontSize: 22 }}>{title}</h3>
      <p style={{ margin: 0, color: C.gray, fontSize: 15, maxWidth: 400, marginInline: 'auto' }}>{body}</p>
    </div>
  );

  return (
    <DashboardShell
      fullName={fullName ?? 'Instructor'}
      role="INSTRUCTOR"
      activeTab={tab}
      navItems={NAV}
      onTabChange={(k) => setTab(k as Tab)}
      onLogout={() => { logout(); navigate('/'); }}
    >
      {/* ── OVERVIEW ─────────────────────────────── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'slideUp .35s ease' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 'clamp(26px,3vw,40px)' }}>
              Hello, {(fullName ?? 'Instructor').split(' ')[0]}! 👋
            </h1>
            <p style={{ margin: '8px 0 0', color: C.gray, fontSize: 15 }}>
              Instructor tools become available in Sprint 2. Your account is active and approved.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="stat-grid">
            {statCard(0, 'Published Courses', '📖')}
            {statCard(0, 'Total Students',    '🎓', '#e65100')}
            {statCard(0, 'Pending Reviews',   '📝', '#7b1fa2')}
          </div>

          {/* Sprint 2 roadmap */}
          <div style={{ ...card }}>
            <h3 style={{ margin: '0 0 20px', fontFamily: "'Carter One', cursive", fontSize: 22 }}>
              🚀 Coming in Sprint 2
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }} className="roadmap-grid">
              {[
                { icon: '➕', title: 'Create Courses',       desc: 'Design your own curriculum with sections and materials.' },
                { icon: '📊', title: 'Student Progress',     desc: 'See how your enrolled students are progressing.' },
                { icon: '📝', title: 'Quiz Management',      desc: 'Build and publish quizzes for your courses.' },
                { icon: '📢', title: 'Announcements',        desc: 'Post updates and messages to enrolled students.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{
                  padding: '16px 18px', borderRadius: 18,
                  background: C.bg, border: `1.5px solid #dcedc8`,
                }}>
                  <p style={{ margin: '0 0 6px', fontSize: 22 }}>{icon}</p>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14 }}>{title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: C.gray, lineHeight: 1.45 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MY COURSES ───────────────────────────── */}
      {tab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp .35s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 32 }}>My Courses</h2>
            <button style={{
              background: C.green, border: 'none', borderRadius: 999,
              padding: '10px 22px', fontWeight: 700, fontSize: 14,
              cursor: 'not-allowed', opacity: 0.5,
              fontFamily: "'Inter', sans-serif",
            }} title="Available in Sprint 2">+ Create Course</button>
          </div>
          {emptyState('📖', 'No courses yet', 'Course creation launches in Sprint 2. Your approved instructor account is ready.')}
        </div>
      )}

      {/* ── STUDENTS ─────────────────────────────── */}
      {tab === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp .35s ease' }}>
          <h2 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 32 }}>Students</h2>
          {emptyState('🎓', 'No students yet', 'Once you publish a course and students enrol, they will appear here.')}
        </div>
      )}

      {/* ── PROFILE ──────────────────────────────── */}
      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp .35s ease' }}>
          <h2 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 32 }}>My Profile</h2>
          <div style={{ ...card, maxWidth: 520 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#fff8e1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, marginBottom: 20,
            }}>📋</div>
            {[
              { label: 'Full Name', value: fullName ?? '—' },
              { label: 'Role',      value: 'Instructor'    },
              { label: 'Status',    value: 'Approved ✓'    },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '14px 0', borderBottom: '1px solid #f0f0f0',
              }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: C.gray }}>{label}</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{value}</span>
              </div>
            ))}
            <p style={{ margin: '20px 0 0', fontSize: 13, color: C.gray }}>
              Bio, expertise tags, and avatar upload will be available in Sprint 2.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .stat-grid    { grid-template-columns: 1fr !important; }
          .roadmap-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .stat-grid    { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </DashboardShell>
  );
}
