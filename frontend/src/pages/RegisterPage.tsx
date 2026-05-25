import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import type { Role } from '../types';
import { AxiosError } from 'axios';
import Sidebar from '../components/Sidebar';

interface FormState { fullName: string; email: string; password: string; confirmPassword: string; role: Role | ''; }
interface FieldErrors { fullName?: string; email?: string; password?: string; confirmPassword?: string; role?: string; }

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ fullName: '', email: '', password: '', confirmPassword: '', role: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverMessage, setServerMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setFieldErrors(p => ({ ...p, [e.target.name]: undefined }));
    setServerMessage('');
  };

  const validate = () => {
    const errors: FieldErrors = {};
    if (!form.fullName.trim()) errors.fullName = 'Full name is required';
    if (!form.email.trim())    errors.email    = 'Email is required';
    if (!form.password)        errors.password = 'Password is required';
    else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (!form.role) errors.role = 'Please select a role';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.register({
        fullName: form.fullName, email: form.email,
        password: form.password, role: form.role as Role,
      });
      setIsSuccess(true);
      setServerMessage(res.data.message);
    } catch (err) {
      const e = err as AxiosError<{ error?: string }>;
      setServerMessage(e.response?.data?.error ?? 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const needsApproval = form.role === 'INSTRUCTOR' || form.role === 'ADMIN';

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
          <h1 className="page-title small">Sign Up</h1>

          {isSuccess ? (
            <div style={{ marginTop: 24 }}>
              <div className="alert alert-success">{serverMessage}</div>
              {form.role === 'STUDENT' && (
                <button className="primary-btn full" style={{ marginTop: 12 }} onClick={() => navigate('/login')}>
                  Login Now
                </button>
              )}
            </div>
          ) : (
            <>
              {needsApproval && (
                <div className="alert alert-warning" style={{ marginTop: 16 }}>
                  ⚠️ {form.role === 'INSTRUCTOR' ? 'Instructor' : 'Admin'} accounts require admin approval before you can log in.
                </div>
              )}
              {serverMessage && <div className="alert alert-error" style={{ marginTop: 12 }}>{serverMessage}</div>}

              <form className="site-form" onSubmit={handleSubmit}>
                <label>
                  <span>Full Name</span>
                  <input type="text" name="fullName" placeholder="Enter your name"
                    value={form.fullName} onChange={handleChange} />
                  {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" name="email" placeholder="Enter your email"
                    value={form.email} onChange={handleChange} />
                  {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                </label>
                <label>
                  <span>Password</span>
                  <input type="password" name="password" placeholder="Create a password"
                    value={form.password} onChange={handleChange} />
                  {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                </label>
                <label>
                  <span>Confirm Password</span>
                  <input type="password" name="confirmPassword" placeholder="Confirm password"
                    value={form.confirmPassword} onChange={handleChange} />
                  {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
                </label>
                <label>
                  <span>I am a...</span>
                  <select name="role" value={form.role} onChange={handleChange}>
                    <option value="">Select a role</option>
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  {fieldErrors.role && <span className="field-error">{fieldErrors.role}</span>}
                </label>
                <button type="submit" className="primary-btn full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
              <p className="form-footer">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
