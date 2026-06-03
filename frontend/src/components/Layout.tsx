import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';
import type React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  /** Hero pages don't show the top green pill shape */
  isHero?: boolean;
}

const NAV_LINKS = [
  { to: '/',        label: 'Home'    },
  { to: '/courses', label: 'Courses' },
  { to: '/about',   label: 'About'   },
];

export default function Layout({ children, isHero = false }: LayoutProps) {
  const [open, setOpen]     = useState(false);
  const { token, role, logout } = useAuth();
  const navigate                = useNavigate();
  const { pathname }            = useLocation();

  const dashPath =
    role === 'STUDENT'    ? '/student/dashboard'
    : role === 'INSTRUCTOR' ? '/instructor/dashboard'
    : '/admin/dashboard';

  const close = () => setOpen(false);

  const navStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 'clamp(40px,6vw,64px)',
    lineHeight: 1,
    color: active ? C.green : C.black,
    textDecoration: 'none',
    letterSpacing: 1,
    transition: 'color .15s',
  });

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: C.bg, overflowX: 'hidden' }}>

      {/* ── Sidebar overlay ─────────────────────────── */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 25,
            background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(2px)',
          }}
          onClick={close}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0,
        width: 320, maxWidth: '88vw', height: '100vh',
        background: C.white, zIndex: 30,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
        padding: '24px 24px 40px',
        boxShadow: '12px 0 40px rgba(0,0,0,0.10)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Close button */}
        <button
          style={{
            width: 68, height: 68, borderRadius: '50%', border: 'none',
            background: C.yellow, fontSize: 28, cursor: 'pointer',
            flexShrink: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 700,
          }}
          onClick={close}
          aria-label="Close menu"
        >✕</button>

        {/* Nav links */}
        <nav style={{
          display: 'flex', flexDirection: 'column', gap: 24,
          marginTop: 72, paddingLeft: 44, flex: 1,
        }}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={navStyle(pathname === to)}
              onClick={close}
            >{label}</Link>
          ))}

          {token ? (
            <>
              <Link
                to={dashPath}
                style={navStyle(false)}
                onClick={close}
              >Dashboard</Link>
              <button
                style={{
                  ...navStyle(false),
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, textAlign: 'left',
                  color: C.gray,
                }}
                onClick={() => { logout(); close(); navigate('/'); }}
              >Logout</button>
            </>
          ) : (
            <Link
              to="/login"
              style={navStyle(pathname === '/login')}
              onClick={close}
            >Login</Link>
          )}
        </nav>

        {/* Sidebar footer */}
        <p style={{
          paddingLeft: 44, margin: 0,
          fontFamily: "'Inter', sans-serif",
          fontSize: 12, color: C.gray, opacity: 0.6,
        }}>UB E-Learning · CEF331</p>
      </aside>

      {/* ── Hamburger button ────────────────────────── */}
      <button
        style={{
          position: 'fixed', top: 24, left: 24,
          width: 58, height: 58, borderRadius: '50%',
          border: 'none', background: C.yellow, color: C.black,
          fontSize: 26, cursor: 'pointer', zIndex: 20,
          boxShadow: C.cardShadow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .15s',
        }}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >☰</button>

      {/* ── Page wrapper ────────────────────────────── */}
      <div style={{ padding: '0 24px 64px', minHeight: '100vh', position: 'relative' }}>

        {/* Top green pill (inner pages) */}
        {!isHero && (
          <div style={{
            position: 'absolute', top: 0,
            left: '50%', transform: 'translateX(-8%)',
            width: 595, height: 128,
            background: C.green,
            borderBottomLeftRadius: 76, borderBottomRightRadius: 76,
            zIndex: 0, pointerEvents: 'none',
          }} />
        )}

        {/* Header — centred logo */}
        <header style={{
          position: 'relative', zIndex: 2,
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', justifyContent: 'center', paddingTop: 12,
        }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="/logo.png"
              alt="Fold"
              style={{ width: 200, maxWidth: '40vw', height: 'auto', display: 'block' }}
            />
          </Link>
        </header>

        {/* Content */}
        <main style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
