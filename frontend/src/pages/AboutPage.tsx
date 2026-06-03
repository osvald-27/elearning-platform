import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { C, Btn } from '../theme';
import bookSvg from '../assets/book.svg';

export default function AboutPage() {
  const pageTitle: React.CSSProperties = {
    margin: 0,
    fontFamily: "'Carter One', cursive",
    fontSize: 'clamp(36px,5vw,80px)',
    lineHeight: 1.05,
  };

  const sectionText: React.CSSProperties = {
    margin: 0, maxWidth: 580, fontSize: 19, lineHeight: 1.75, color: C.gray,
  };

  return (
    <Layout>
      {/* ── Split section ───────────────────────────── */}
      <section style={{
        maxWidth: 1280, margin: '48px auto 0',
        display: 'grid', gridTemplateColumns: '1.2fr 1fr',
        gap: 48, alignItems: 'center',
      }}
        className="about-grid"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp .5s ease' }}>
          <h1 style={pageTitle}>About Fold</h1>
          <p style={sectionText}>
            Fold is the University of Buea's e-learning platform for the CEF331 course project —
            built by students, for students. The name captures our belief that great knowledge,
            like a well-folded map, reveals the path forward.
          </p>
          <p style={sectionText}>
            The platform provides structured learning paths, guided lessons by approved instructors,
            and flexible self-paced study — so every learner can grow from wherever they are.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 8 }}>
            {[
              { value: '3',      label: 'User Roles' },
              { value: 'Sprint', label: 'Based Dev' },
              { value: 'UB',     label: 'Campus' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 40, color: C.greenDark }}>
                  {value}
                </p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
            <Link to="/courses" style={Btn.primary as React.CSSProperties}>Browse Courses</Link>
            <Link to="/register" style={Btn.secondary as React.CSSProperties}>Get Started</Link>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', animation: 'slideUp .6s ease' }}>
          <div style={{
            width: 'min(460px,85vw)', height: 'min(460px,85vw)',
            background: C.white, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: C.cardShadow,
          }}>
            <img src={bookSvg} alt="Learning" style={{ width: 'min(220px,40vw)', height: 'auto' }} />
          </div>
        </div>
      </section>

      {/* ── Team section ──────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '72px auto 0', animation: 'slideUp .65s ease' }}>
        <h2 style={{
          fontFamily: "'Carter One', cursive",
          fontSize: 'clamp(28px,3.5vw,52px)',
          margin: '0 0 32px', textAlign: 'center',
        }}>The Team</h2>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 24,
        }}
          className="team-grid"
        >
          {[
            { title: 'Backend & Database', desc: 'Spring Boot 3.2 · PostgreSQL · JPA · JWT auth with role-based approval flow.', icon: '⚙️' },
            { title: 'Frontend',           desc: 'React 19 · TypeScript · Vite · Responsive SPA matching the designer\'s visual language.', icon: '🎨' },
            { title: 'Database',           desc: 'Schema design, seed data, migrations and relational modelling for all platform entities.', icon: '🗄️' },
          ].map(({ title, desc, icon }) => (
            <div key={title} style={{
              background: C.white, borderRadius: 36,
              padding: '28px 24px', boxShadow: C.cardShadow,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <span style={{ fontSize: 36 }}>{icon}</span>
              <h3 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 22 }}>{title}</h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: C.gray }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .about-grid { grid-template-columns: 1fr !important; }
          .team-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}
