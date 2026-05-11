import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import type { Role } from '../types';
import { AxiosError } from 'axios';

interface FormState { fullName: string; email: string; password: string; confirmPassword: string; role: Role | ''; }
interface FieldErrors { fullName?: string; email?: string; password?: string; confirmPassword?: string; role?: string; }

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ fullName: '', email: '', password: '', confirmPassword: '', role: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverMessage, setServerMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [e.target.name]: undefined }));
    setServerMessage('');
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.fullName.trim()) errors.fullName = 'Full name is required';
    if (!form.email.trim())    errors.email    = 'Email is required';
    if (!form.password)        errors.password = 'Password is required';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (!form.role)            errors.role     = 'Role is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.register({ fullName: form.fullName, email: form.email, password: form.password, role: form.role as Role });
      setIsSuccess(true);
      setServerMessage(res.data.message);
    } catch (err) {
      const error = err as AxiosError<{ error?: string; details?: Record<string, string> }>;
      const data  = error.response?.data;
      if (data?.details) {
        setFieldErrors(data.details as FieldErrors);
      } else {
        setServerMessage(data?.error ?? 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const needsApproval = form.role === 'INSTRUCTOR' || form.role === 'ADMIN';

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Create Account</h1>
        <p style={s.subtitle}>UB E-Learning Platform — CEF331</p>

        {isSuccess && (
          <div style={s.successBox}>
            <p>{serverMessage}</p>
            {form.role === 'STUDENT' && (
              <button style={s.linkBtn} onClick={() => navigate('/login')}>Go to Login →</button>
            )}
          </div>
        )}

        {!isSuccess && (
          <>
            {needsApproval && (
              <div style={s.warningBox}>
                ⚠️ {form.role === 'INSTRUCTOR' ? 'Instructor' : 'Admin'} accounts require admin approval before you can log in.
              </div>
            )}
            {serverMessage && <div style={s.errorBox}>{serverMessage}</div>}

            {(['fullName', 'email', 'password', 'confirmPassword'] as const).map(field => (
              <div key={field} style={s.field}>
                <label style={s.label}>
                  {field === 'fullName' ? 'Full Name' : field === 'confirmPassword' ? 'Confirm Password' : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  style={s.input}
                  name={field}
                  type={field.toLowerCase().includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={form[field]}
                  onChange={handleChange}
                  placeholder={field === 'fullName' ? 'e.g. John Doe' : field === 'email' ? 'you@example.com' : ''}
                />
                {fieldErrors[field] && <span style={s.fieldError}>{fieldErrors[field]}</span>}
              </div>
            ))}

            <div style={s.field}>
              <label style={s.label}>Role</label>
              <select style={s.input} name="role" value={form.role} onChange={handleChange}>
                <option value="">Select a role...</option>
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
              </select>
              {fieldErrors.role && <span style={s.fieldError}>{fieldErrors.role}</span>}
            </div>

            <button style={s.btn} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
            <p style={s.footer}>Already have an account? <Link to="/login">Log in</Link></p>
          </>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:       { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' },
  card:       { background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px' },
  title:      { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e' },
  subtitle:   { margin: '0.25rem 0 1.5rem', color: '#666', fontSize: '0.875rem' },
  field:      { marginBottom: '1rem' },
  label:      { display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.875rem', color: '#333' },
  input:      { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '5px', fontSize: '0.95rem', boxSizing: 'border-box' },
  fieldError: { color: '#c0392b', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' },
  btn:        { width: '100%', padding: '0.75rem', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
  warningBox: { background: '#fff9e6', border: '1px solid #f0c040', borderRadius: '5px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#7a5800' },
  errorBox:   { background: '#fdecea', border: '1px solid #e57373', borderRadius: '5px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#c0392b' },
  successBox: { background: '#e8f5e9', border: '1px solid #66bb6a', borderRadius: '5px', padding: '1rem', textAlign: 'center', color: '#2e7d32' },
  linkBtn:    { background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontWeight: 600, marginTop: '0.5rem', fontSize: '0.95rem' },
  footer:     { textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#555' },
};
