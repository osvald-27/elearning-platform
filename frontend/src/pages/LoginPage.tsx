import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
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
      const error  = err as AxiosError<{ error?: string }>;
      const status = error.response?.status;
      if (status === 403) {
        setError('Your account is pending admin approval.');
      } else {
        setError(error.response?.data?.error ?? 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Welcome Back</h1>
        <p style={s.subtitle}>UB E-Learning Platform — CEF331</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <div style={s.field}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            placeholder="you@example.com" />
        </div>

        <div style={s.field}>
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Your password" />
        </div>

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <p style={s.footer}>No account? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:     { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' },
  card:     { background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  title:    { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e' },
  subtitle: { margin: '0.25rem 0 1.5rem', color: '#666', fontSize: '0.875rem' },
  field:    { marginBottom: '1rem' },
  label:    { display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.875rem', color: '#333' },
  input:    { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '5px', fontSize: '0.95rem', boxSizing: 'border-box' },
  btn:      { width: '100%', padding: '0.75rem', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
  errorBox: { background: '#fdecea', border: '1px solid #e57373', borderRadius: '5px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#c0392b' },
  footer:   { textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#555' },
};
