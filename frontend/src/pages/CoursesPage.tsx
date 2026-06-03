import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { C, Btn } from '../theme';
import bookSvg      from '../assets/book.svg';
import pencilSvg    from '../assets/pencil.svg';
import briefcaseSvg from '../assets/briefcase.svg';

export const SAMPLE_COURSES = [
  {
    id: 1,
    title: 'Frontend Basics',
    description: 'HTML, CSS, and JavaScript foundations for modern web development. Build real pages from scratch.',
    instructor: 'Dr. Djouela Ines Raissa',
    level: 'Beginner',
    duration: '6 weeks',
    icon: bookSvg,
    tag: 'Web Dev',
  },
  {
    id: 2,
    title: 'UI Design Essentials',
    description: 'Layout, typography, spacing, colour theory, and interface design principles for developers.',
    instructor: 'Dr. Djouela Ines Raissa',
    level: 'Intermediate',
    duration: '4 weeks',
    icon: pencilSvg,
    tag: 'Design',
  },
  {
    id: 3,
    title: 'Career Readiness',
    description: 'Portfolio building, technical interview preparation, and project-based practical exercises.',
    instructor: 'Dr. Djouela Ines Raissa',
    level: 'All levels',
    duration: '5 weeks',
    icon: briefcaseSvg,
    tag: 'Career',
  },
];

export default function CoursesPage() {
  const pageTitle: React.CSSProperties = {
    margin: 0, fontFamily: "'Carter One', cursive",
    fontSize: 'clamp(36px,5vw,76px)', lineHeight: 1.05,
  };

  return (
    <Layout>
      {/* ── Page hero ─────────────────────────────── */}
      <div style={{
        maxWidth: 1280, margin: '48px auto 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24,
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={pageTitle}>Courses</h1>
          <p style={{ margin: '12px 0 0', fontSize: 19, color: C.gray, lineHeight: 1.6, maxWidth: 520 }}>
            Choose a learning path that matches your goals. More courses are added each sprint.
          </p>
        </div>
        <Link to="/register" style={Btn.primary as React.CSSProperties}>Enrol Now</Link>
      </div>

      {/* ── Course cards ──────────────────────────── */}
      <section style={{
        maxWidth: 1280, margin: '40px auto 0',
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24,
      }}
        className="course-grid"
      >
        {SAMPLE_COURSES.map((course) => (
          <article key={course.id} style={{
            background: C.white, borderRadius: 36, padding: '28px 28px 32px',
            boxShadow: C.cardShadow,
            display: 'flex', flexDirection: 'column', gap: 16,
            animation: 'slideUp .4s ease',
          }}>
            {/* Icon */}
            <img src={course.icon} alt={course.title} style={{ width: 80, height: 80, objectFit: 'contain' }} />

            {/* Tag + Level */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                padding: '3px 12px', borderRadius: 999,
                background: C.lightGreen, color: C.greenDark,
                fontWeight: 700, fontSize: 12, letterSpacing: '0.4px',
              }}>{course.tag}</span>
              <span style={{
                padding: '3px 12px', borderRadius: 999,
                background: '#f5f5f5', color: C.gray,
                fontWeight: 600, fontSize: 12,
              }}>{course.level}</span>
            </div>

            <h2 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 24 }}>
              {course.title}
            </h2>
            <p style={{ margin: 0, lineHeight: 1.65, color: C.gray, fontSize: 15, flex: 1 }}>
              {course.description}
            </p>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: C.gray, fontWeight: 500 }}>
              <span>🕐 {course.duration}</span>
              <span>👤 {course.instructor.split(' ').slice(-1)[0]}</span>
            </div>

            <Link
              to={`/courses/${course.id}`}
              style={{ ...Btn.full as React.CSSProperties, marginTop: 4 }}
            >View Course</Link>
          </article>
        ))}
      </section>

      {/* ── Sprint 2 notice ───────────────────────── */}
      <div style={{
        maxWidth: 1280, margin: '48px auto 0',
        background: C.white, borderRadius: 36, padding: '24px 32px',
        boxShadow: C.cardShadow, display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <span style={{ fontSize: 32 }}>🚀</span>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, fontFamily: "'Carter One', cursive" }}>
            More courses coming in Sprint 2
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: C.gray }}>
            Course creation, enrolment, quiz submissions and progress tracking are all on the roadmap.
            Create an account now to be ready.
          </p>
        </div>
        <Link to="/register" style={{ ...Btn.primary as React.CSSProperties, flexShrink: 0, marginLeft: 'auto' }}>
          Register
        </Link>
      </div>

      <style>{`
        @media (max-width: 980px)  { .course-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 620px)  { .course-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </Layout>
  );
}
