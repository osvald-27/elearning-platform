import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import type { NavItem } from '../components/DashboardShell';
import { C } from '../theme';
import bookSvg      from '../assets/book.svg';
import pencilSvg    from '../assets/pencil.svg';
import briefcaseSvg from '../assets/briefcase.svg';

type Tab = 'overview' | 'courses' | 'profile';

const NAV: NavItem[] = [
  { key: 'overview', icon: '🏠', label: 'Overview'   },
  { key: 'courses',  icon: '📚', label: 'My Courses' },
  { key: 'profile',  icon: '👤', label: 'Profile'    },
];

const PREVIEW_COURSES = [
  { title: 'Frontend Basics',    icon: bookSvg,      tag: 'Web Dev',  status: 'Not enrolled' },
  { title: 'UI Design Essentials', icon: pencilSvg,  tag: 'Design',   status: 'Not enrolled' },
  { title: 'Career Readiness',   icon: briefcaseSvg, tag: 'Career',   status: 'Not enrolled' },
];

export default function StudentDashboard() {
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

  return (
    <DashboardShell
      fullName={fullName ?? 'Student'}
      role="STUDENT"
      activeTab={tab}
      navItems={NAV}
      onTabChange={(k) => setTab(k as Tab)}
      onLogout={() => { logout(); navigate('/'); }}
    >
      {/* ── OVERVIEW ─────────────────────────────── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'slideUp .35s ease' }}>
          {/* Greeting */}
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 'clamp(26px,3vw,40px)' }}>
              Welcome back, {(fullName ?? 'Student').split(' ')[0]}! 👋
            </h1>
            <p style={{ margin: '8px 0 0', color: C.gray, fontSize: 15 }}>
              Your learning journey starts here. Courses and progress tracking roll out in Sprint 2.
            </p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="stat-grid">
            {statCard(0,  'Enrolled Courses', '📚')}
            {statCard(0,  'Completed',        '✅', C.greenDark)}
            {statCard(0,  'Quizzes Taken',    '📝', '#e65100')}
          </div>

          {/* Sprint 2 banner */}
          <div style={{
            ...card, display: 'flex', alignItems: 'center', gap: 20,
            background: C.lightGreen, borderRadius: 24,
          }}>
            <span style={{ fontSize: 40 }}>🚀</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, fontFamily: "'Carter One', cursive" }}>
                Sprint 2 Features Coming Soon
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: C.gray, lineHeight: 1.5 }}>
                Course enrolment · Progress tracking · Quiz submission · Certificates
              </p>
            </div>
          </div>

          {/* Browse courses CTA */}
          <div style={{ ...card }}>
            <h3 style={{ margin: '0 0 16px', fontFamily: "'Carter One', cursive", fontSize: 22 }}>
              Explore Available Courses
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }} className="course-mini-grid">
              {PREVIEW_COURSES.map((c) => (
                <div key={c.title} style={{
                  padding: '16px', borderRadius: 18,
                  border: `1.5px solid #e8e8e8`, background: C.bg,
                  display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start',
                }}>
                  <img src={c.icon} alt={c.title} style={{ width: 44, height: 44 }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{c.title}</p>
                  <span style={{
                    padding: '2px 10px', borderRadius: 999,
                    background: C.lightGreen, color: C.greenDark,
                    fontSize: 11, fontWeight: 700,
                  }}>{c.tag}</span>
                  <button
                    style={{
                      background: 'none', border: `1.5px solid ${C.greenDark}`,
                      borderRadius: 999, padding: '5px 14px', fontSize: 12,
                      fontWeight: 700, cursor: 'pointer', color: C.greenDark,
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onClick={() => navigate('/courses')}
                  >View →</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MY COURSES ───────────────────────────── */}
      {tab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp .35s ease' }}>
          <h2 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 32 }}>My Courses</h2>
          <div style={{
            ...card, textAlign: 'center', padding: '60px 40px',
          }}>
            <p style={{ fontSize: 56, margin: '0 0 16px' }}>📚</p>
            <h3 style={{ margin: '0 0 8px', fontFamily: "'Carter One', cursive", fontSize: 24 }}>
              No enrolments yet
            </h3>
            <p style={{ margin: '0 0 24px', color: C.gray, fontSize: 15 }}>
              Course enrolment launches in Sprint 2. Browse available courses and get ready.
            </p>
            <button
              style={{
                background: C.green, border: 'none', borderRadius: 999,
                padding: '12px 28px', fontWeight: 700, fontSize: 15,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}
              onClick={() => navigate('/courses')}
            >Browse Courses</button>
          </div>
        </div>
      )}

      {/* ── PROFILE ──────────────────────────────── */}
      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp .35s ease' }}>
          <h2 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 32 }}>My Profile</h2>
          <div style={{ ...card, maxWidth: 520 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: C.lightGreen, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 36, marginBottom: 20,
            }}>🎓</div>
            {[
              { label: 'Full Name', value: fullName ?? '—' },
              { label: 'Role',      value: 'Student'       },
              { label: 'Status',    value: 'Active ✓'      },
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
              Profile editing and avatar upload will be available in Sprint 2.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .stat-grid        { grid-template-columns: 1fr !important; }
          .course-mini-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .stat-grid        { grid-template-columns: repeat(2,1fr) !important; }
          .course-mini-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </DashboardShell>
  );
}
