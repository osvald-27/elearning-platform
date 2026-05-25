import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { AxiosError } from 'axios';
import Sidebar from '../components/Sidebar';

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await authService.login({ email, password });
      login(res.data);
      const map: Record<Role, string> = {
        STUDENT:    '/student/dashboard',
        INSTRUCTOR: '/instructor/dashboard',
        ADMIN:      '/admin/dashboard',
      };
      navigate(map[res.data.role], { replace: true });
    } catch (err) {
      const e = err as AxiosError<{ error?: string }>;
      if (e.response?.status === 403) {
        setError('Your account is pending admin approval.');
      } else {
        setError(e.response?.data?.error ?? 'Invalid credentials. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <main className="page inner-page">
      <Sidebar />
      <header className="site-header">
        <Link to="/" className="logo-link">
          <img src="/logo.png" alt="Fold logo" className="site-logo" />
        </Link>
      </header>

      <section className="form-section">
        <div className="form-card">
          <h1 className="page-title small">Login</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <form className="site-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input type="email" placeholder="Enter your email"
                value={email} onChange={e => { setEmail(e.target.value); setError(''); }} />
            </label>
            <label>
              <span>Password</span>
              <input type="password" placeholder="Enter your password"
                value={password} onChange={e => { setPassword(e.target.value); setError(''); }} />
            </label>
            <button type="submit" className="primary-btn full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="form-footer">
            No account yet? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
