import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { C, Btn } from '../theme';
import { SAMPLE_COURSES } from './CoursesPage';

export default function CourseInfoPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const course   = SAMPLE_COURSES.find((c) => c.id === Number(id));

  if (!course) {
    return (
      <Layout>
        <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
          <p style={{ fontSize: 64 }}>🔍</p>
          <h2 style={{ fontFamily: "'Carter One', cursive", fontSize: 36 }}>Course not found</h2>
          <button style={Btn.primary} onClick={() => navigate('/courses')}>Back to Courses</button>
        </div>
      </Layout>
    );
  }

  const pageTitle: React.CSSProperties = {
    margin: 0, fontFamily: "'Carter One', cursive",
    fontSize: 'clamp(34px,5vw,72px)', lineHeight: 1.05,
  };

  const syllabus: Record<number, string[]> = {
    1: [
      'Semantic HTML5 document structure',
      'CSS Flexbox and Grid layout systems',
      'Responsive design and media queries',
      'JavaScript fundamentals: variables, functions, events',
      'DOM manipulation and event handling',
      'Building and deploying a small real-world project',
    ],
    2: [
      'Colour theory and visual hierarchy',
      'Typography: choosing and pairing typefaces',
      'Spacing, alignment, and grid systems',
      'Component design and reusable patterns',
      'Accessibility and inclusive design principles',
      'Designing and presenting a portfolio piece',
    ],
    3: [
      'Structuring a compelling developer portfolio',
      'Writing an impactful CV and cover letter',
      'Technical interview patterns and problem-solving',
      'Live coding practice sessions',
      'Open-source contribution workflow',
      'Mock interviews and constructive feedback',
    ],
  };

  const weeks = syllabus[course.id] ?? [];

  return (
    <Layout>
      <section style={{
        maxWidth: 1280, margin: '48px auto 0',
        display: 'grid', gridTemplateColumns: '1.5fr 0.85fr',
        gap: 28, alignItems: 'start',
      }}
        className="info-grid"
      >
        {/* ── Main ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp .4s ease' }}>
          {/* Back */}
          <button
            style={{ ...Btn.secondary, width: 'fit-content', minHeight: 42, fontSize: 14 }}
            onClick={() => navigate('/courses')}
          >← All Courses</button>

          {/* Title + tags */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 14px', borderRadius: 999, background: C.lightGreen, color: C.greenDark, fontWeight: 700, fontSize: 12 }}>
                {course.tag}
              </span>
              <span style={{ padding: '4px 14px', borderRadius: 999, background: '#f5f5f5', color: C.gray, fontWeight: 600, fontSize: 12 }}>
                {course.level}
              </span>
            </div>
            <h1 style={pageTitle}>{course.title}</h1>
            <p style={{ margin: '16px 0 0', fontSize: 19, lineHeight: 1.7, color: C.gray, maxWidth: 560 }}>
              {course.description}
            </p>
          </div>

          {/* What you'll learn */}
          <div style={{
            background: C.white, borderRadius: 36, padding: '28px 32px',
            boxShadow: C.cardShadow,
          }}>
            <h3 style={{ margin: '0 0 18px', fontFamily: "'Carter One', cursive", fontSize: 22 }}>
              What You'll Learn
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weeks.map((item) => (
                <li key={item} style={{ fontSize: 15, lineHeight: 1.6, color: C.gray }}>
                  <span style={{ color: C.greenDark, fontWeight: 700 }}>✓ </span>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/register" style={Btn.primary as React.CSSProperties}>Enrol Now — It's Free</Link>
            <Link to="/login"    style={Btn.secondary as React.CSSProperties}>Already Enrolled? Log In</Link>
          </div>
        </div>

        {/* ── Sidebar card ──────────────────────────── */}
        <aside style={{ animation: 'slideUp .5s ease' }}>
          <div style={{
            background: C.white, borderRadius: 36, padding: '32px 28px',
            boxShadow: C.cardShadow, display: 'flex', flexDirection: 'column', gap: 18,
          }}>
            <img src={course.icon} alt={course.title} style={{ width: 100, height: 100, objectFit: 'contain' }} />

            {[
              { label: 'Duration',    value: course.duration },
              { label: 'Level',       value: course.level },
              { label: 'Format',      value: 'Self-paced' },
              { label: 'Instructor',  value: course.instructor },
              { label: 'Language',    value: 'English' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.gray }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.black, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
              </div>
            ))}

            <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />

            <Link to="/register" style={{ ...Btn.full as React.CSSProperties }}>
              Start Learning
            </Link>
          </div>
        </aside>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .info-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}
