import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { C, Btn } from '../theme';
import bookSvg    from '../assets/book.svg';
import pencilSvg  from '../assets/pencil.svg';

type Slide = 'slide1' | 'slide2' | 'slide3';

export default function HomePage() {
  const [current, setCurrent] = useState<Slide>('slide1');

  const slide: Record<string, React.CSSProperties> = {
    base: {
      display: 'none',
      minHeight: 'calc(100vh - 100px)',
      padding: '110px 0 40px',
      animation: 'fadeIn .4s ease',
    },
    active: { display: 'block' },
  };

  const heroTitle: React.CSSProperties = {
    margin: 0,
    fontFamily: "'Carter One', cursive",
    fontSize: 'clamp(48px,7vw,140px)',
    lineHeight: 1.05,
  };

  const circleWrap: React.CSSProperties = {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
  };

  const circle = (size: number): React.CSSProperties => ({
    width: size, height: size, maxWidth: '90vw',
    background: C.white, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: C.cardShadow,
  });

  return (
    <Layout isHero>
      <section style={{ position: 'relative', maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Slide 1: Welcome ─────────────────────── */}
        <article style={{ ...slide.base, ...(current === 'slide1' ? slide.active : {}) }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <h1 style={{ ...heroTitle, color: C.gray }}>Welcome To</h1>

            <div style={{ marginTop: 8 }}>
              <img src="/logo.png" alt="Fold" style={{ width: 'min(520px,80vw)', height: 'auto', display: 'block' }} />
            </div>

            <p style={{
              margin: 0, fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(28px,4vw,64px)', letterSpacing: 1,
            }}>Where Knowledge Unfolds</p>

            <div style={{ marginTop: 16 }}>
              <button style={Btn.primary} onClick={() => setCurrent('slide2')}>
                Explore →
              </button>
            </div>
          </div>
        </article>

        {/* ── Slide 2: Learn From Home ─────────────── */}
        <article style={{ ...slide.base, ...(current === 'slide2' ? slide.active : {}) }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 48, alignItems: 'center', maxWidth: 1100, margin: '0 auto',
          }}
            className="hero-grid"
          >
            <div style={circleWrap}>
              <div style={circle(520)}>
                <img src={bookSvg} alt="Book" style={{ width: 'min(260px,38vw)', height: 'auto' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <h2 style={heroTitle}>
                <span style={{ color: C.gray }}>Learn</span>{' '}
                <span style={{ color: C.white }}>From Home</span>
              </h2>
              <p style={{ margin: 0, fontSize: 20, lineHeight: 1.7, color: C.gray, maxWidth: 480 }}>
                Access structured courses, guided lessons, and practical resources — all from your browser.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <Link to="/register" style={Btn.primaryLarge as React.CSSProperties}>Sign Up</Link>
                <button style={Btn.secondary} onClick={() => setCurrent('slide3')}>Next →</button>
              </div>
            </div>
          </div>
        </article>

        {/* ── Slide 3: Build Your Future ───────────── */}
        <article style={{ ...slide.base, ...(current === 'slide3' ? slide.active : {}) }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 48, alignItems: 'center', maxWidth: 1100, margin: '0 auto',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <h2 style={heroTitle}>
                <span style={{ color: C.gray }}>Build</span>{' '}
                <span style={{ color: C.white }}>Your Future</span>
              </h2>
              <p style={{ margin: 0, fontSize: 20, lineHeight: 1.7, color: C.gray, maxWidth: 480 }}>
                Explore practical learning paths, guided lessons, and curated resources designed to help
                you grow from anywhere in the world.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <Link to="/courses" style={Btn.primary as React.CSSProperties}>Browse Courses</Link>
                <Link to="/about"   style={Btn.secondary as React.CSSProperties}>Learn More</Link>
              </div>
            </div>

            <div style={circleWrap}>
              <div style={circle(520)}>
                <img src={pencilSvg} alt="Pencil" style={{ width: 'min(240px,35vw)', height: 'auto' }} />
              </div>
            </div>
          </div>
        </article>

        {/* ── Slide dots ───────────────────────────── */}
        <div style={{
          position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 10, zIndex: 2,
        }}>
          {(['slide1','slide2','slide3'] as Slide[]).map((s) => (
            <button
              key={s}
              onClick={() => setCurrent(s)}
              style={{
                width: current === s ? 28 : 10, height: 10,
                borderRadius: 999, border: 'none',
                background: current === s ? C.greenDark : 'rgba(0,0,0,0.2)',
                cursor: 'pointer', padding: 0,
                transition: 'all .25s',
              }}
            />
          ))}
        </div>
      </section>

      {/* Responsive grid fix */}
      <style>{`
        @media (max-width: 860px) {
          .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
        }
      `}</style>
    </Layout>
  );
}
