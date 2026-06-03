import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { AxiosError } from 'axios';
import Layout from '../components/Layout';
import { C, Btn, Card, Input } from '../theme';

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authService.login({ email, password });
      login(res.data);
      const dashboards: Record<Role, string> = {
        STUDENT:    '/student/dashboard',
        INSTRUCTOR: '/instructor/dashboard',
        ADMIN:      '/admin/dashboard',
      };
      navigate(dashboards[res.data.role], { replace: true });
    } catch (err) {
      const e      = err as AxiosError<{ error?: string }>;
      const status = e.response?.status;
      if (status === 403) {
        setError('Your account is pending admin approval. You will be notified once approved.');
      } else {
        setError(e.response?.data?.error ?? 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const label: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 8,
    fontWeight: 600, fontSize: 14, color: C.black,
  };

  return (
    <Layout>
      <section style={{ maxWidth: 640, margin: '40px auto 0', animation: 'slideUp .4s ease' }}>
        <div style={{ ...Card, padding: '40px 36px' }}>

          {/* Title */}
          <h1 style={{
            margin: 0, fontFamily: "'Carter One', cursive",
            fontSize: 'clamp(32px,4vw,52px)', textAlign: 'center', lineHeight: 1.1,
          }}>Welcome Back</h1>
          

          {/* Error */}
          {error && (
            <div style={{
              background: C.errorBg, border: `1px solid ${C.errorBorder}`,
              borderRadius: 16, padding: '12px 16px',
              marginBottom: 20, fontSize: 14, color: C.errorRed,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <label style={label}>
              <span>Email Address</span>
              <input
                style={Input}
                type="email"
                value={email}
                placeholder="you@example.com"
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </label>

            <label style={label}>
              <span>Password</span>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...Input, paddingRight: 50 }}
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  placeholder="Your password"
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 18, color: C.gray, padding: 4,
                  }}
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                >{showPwd ? '🙈' : '👁️'}</button>
              </div>
            </label>

            <button
              style={{
                ...Btn.full,
                marginTop: 8,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </div>

          {/* Footer */}
          <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 14, color: C.gray }}>
            No account yet?{' '}
            <Link to="/register" style={{ fontWeight: 700, color: C.greenDark }}>
              Register here
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
