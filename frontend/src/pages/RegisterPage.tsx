import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import type { Role } from '../types';
import { AxiosError } from 'axios';
import Layout from '../components/Layout';
import { C, Btn, Card, Input } from '../theme';

interface FormState {
  fullName:        string;
  email:           string;
  password:        string;
  confirmPassword: string;
  role:            Role | '';
}
interface FieldErrors {
  fullName?:        string;
  email?:           string;
  password?:        string;
  confirmPassword?: string;
  role?:            string;
}

const ROLES: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: 'STUDENT',    label: 'Student',    icon: '🎓', desc: 'Enrol in courses and track your progress.' },
  { value: 'INSTRUCTOR', label: 'Instructor', icon: '📋', desc: 'Create and manage your own courses. Requires admin approval.' },
  { value: 'ADMIN',      label: 'Admin',      icon: '🛡️', desc: 'Manage the platform and approve accounts. Requires admin approval.' },
];

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    fullName: '', email: '', password: '', confirmPassword: '', role: '',
  });
  const [fieldErrors,    setFieldErrors]    = useState<FieldErrors>({});
  const [serverMessage,  setServerMessage]  = useState('');
  const [isSuccess,      setIsSuccess]      = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [showPwd,        setShowPwd]        = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setServerMessage('');
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.fullName.trim())                        errors.fullName        = 'Full name is required';
    if (!form.email.trim())                           errors.email           = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))        errors.email           = 'Enter a valid email address';
    if (!form.password)                               errors.password        = 'Password is required';
    else if (form.password.length < 6)                errors.password        = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword)       errors.confirmPassword = 'Passwords do not match';
    if (!form.role)                                   errors.role            = 'Please select a role';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.register({
        fullName: form.fullName,
        email:    form.email,
        password: form.password,
        role:     form.role as Role,
      });
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

  const label: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 8,
    fontWeight: 600, fontSize: 14, color: C.black,
  };

  const fieldError: React.CSSProperties = {
    color: C.errorRed, fontSize: 12, marginTop: 4, display: 'block',
  };

  return (
    <Layout>
      <section style={{ maxWidth: 640, margin: '40px auto 0', animation: 'slideUp .4s ease' }}>
        <div style={{ ...Card, padding: '40px 36px' }}>

          {/* Title */}
          <h1 style={{
            margin: 0, fontFamily: "'Carter One', cursive",
            fontSize: 'clamp(30px,4vw,50px)', textAlign: 'center', lineHeight: 1.1,
          }}>Create Account</h1>

          {/* ── SUCCESS STATE ──────────────────────── */}
          {isSuccess && (
            <div style={{ animation: 'fadeIn .3s ease' }}>
              <div style={{
                background: C.successBg, border: `1px solid ${C.successBorder}`,
                borderRadius: 20, padding: '24px',
                textAlign: 'center', color: C.greenDark,
              }}>
                <p style={{ fontSize: 40, margin: '0 0 8px' }}>🎉</p>
                <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 16 }}>{serverMessage}</p>
                <button style={Btn.primary} onClick={() => navigate('/login')}>
                  Go to Login →
                </button>
              </div>
              {needsApproval && (
                <p style={{
                  marginTop: 16, fontSize: 13, color: C.gray,
                  textAlign: 'center', lineHeight: 1.6,
                }}>
                  ⏳ An administrator will review your account. You'll be able to log in
                  once it has been approved.
                </p>
              )}
            </div>
          )}

          {/* ── FORM ──────────────────────────────── */}
          {!isSuccess && (
            <>
              {/* Approval warning */}
              {needsApproval && (
                <div style={{
                  background: C.warningBg, border: '1px solid #f0c040',
                  borderRadius: 16, padding: '12px 16px',
                  marginBottom: 20, fontSize: 13, color: C.warningText,
                  display: 'flex', gap: 8,
                }}>
                  <span>⚠️</span>
                  <span>
                    <strong>{form.role === 'INSTRUCTOR' ? 'Instructor' : 'Admin'}</strong> accounts
                    require admin approval before you can log in.
                  </span>
                </div>
              )}

              {/* Server error */}
              {serverMessage && (
                <div style={{
                  background: C.errorBg, border: `1px solid ${C.errorBorder}`,
                  borderRadius: 16, padding: '12px 16px',
                  marginBottom: 20, fontSize: 14, color: C.errorRed,
                  display: 'flex', gap: 8,
                }}>
                  <span>⚠️</span><span>{serverMessage}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Full name */}
                <label style={label}>
                  <span>Full Name</span>
                  <input
                    style={{ ...Input, borderColor: fieldErrors.fullName ? C.errorRed : '#d9d9d9' }}
                    name="fullName" type="text"
                    value={form.fullName} placeholder="e.g. Jean Dupont"
                    onChange={handleChange}
                  />
                  {fieldErrors.fullName && <span style={fieldError}>{fieldErrors.fullName}</span>}
                </label>

                {/* Email */}
                <label style={label}>
                  <span>Email Address</span>
                  <input
                    style={{ ...Input, borderColor: fieldErrors.email ? C.errorRed : '#d9d9d9' }}
                    name="email" type="email"
                    value={form.email} placeholder="you@example.com"
                    onChange={handleChange}
                  />
                  {fieldErrors.email && <span style={fieldError}>{fieldErrors.email}</span>}
                </label>

                {/* Password */}
                <label style={label}>
                  <span>Password</span>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{
                        ...Input, paddingRight: 50,
                        borderColor: fieldErrors.password ? C.errorRed : '#d9d9d9',
                      }}
                      name="password"
                      type={showPwd ? 'text' : 'password'}
                      value={form.password} placeholder="Min. 6 characters"
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute', right: 14, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 18, color: C.gray, padding: 4,
                      }}
                      onClick={() => setShowPwd((v) => !v)}
                      tabIndex={-1}
                    >{showPwd ? '🙈' : '👁️'}</button>
                  </div>
                  {fieldErrors.password && <span style={fieldError}>{fieldErrors.password}</span>}
                </label>

                {/* Confirm password */}
                <label style={label}>
                  <span>Confirm Password</span>
                  <input
                    style={{
                      ...Input,
                      borderColor: fieldErrors.confirmPassword ? C.errorRed : '#d9d9d9',
                    }}
                    name="confirmPassword"
                    type={showPwd ? 'text' : 'password'}
                    value={form.confirmPassword} placeholder="Repeat your password"
                    onChange={handleChange}
                  />
                  {fieldErrors.confirmPassword && (
                    <span style={fieldError}>{fieldErrors.confirmPassword}</span>
                  )}
                </label>

                {/* ── Role selection (designer missed this) ── */}
                <div>
                  <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14 }}>
                    I am joining as a…
                    {fieldErrors.role && <span style={{ ...fieldError, display: 'inline', marginLeft: 8 }}>{fieldErrors.role}</span>}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ROLES.map(({ value, label: rLabel, icon, desc }) => {
                      const selected = form.role === value;
                      return (
                        <label
                          key={value}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 18px', borderRadius: 16, cursor: 'pointer',
                            border: `2px solid ${selected ? C.green : '#e0e0e0'}`,
                            background: selected ? C.lightGreen : C.white,
                            transition: 'all .15s',
                          }}
                        >
                          <input
                            type="radio" name="role" value={value}
                            checked={selected}
                            onChange={handleChange}
                            style={{ display: 'none' }}
                          />
                          <span style={{ fontSize: 24 }}>{icon}</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{rLabel}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.gray, lineHeight: 1.4 }}>
                              {desc}
                            </p>
                          </div>
                          {selected && (
                            <span style={{
                              marginLeft: 'auto', width: 22, height: 22,
                              borderRadius: '50%', background: C.green,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: C.white, fontWeight: 700, fontSize: 13, flexShrink: 0,
                            }}>✓</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  style={{
                    ...Btn.full, marginTop: 8,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating account…' : 'Register'}
                </button>
              </div>

              <p style={{ margin: '20px 0 0', textAlign: 'center', fontSize: 14, color: C.gray }}>
                Already have an account?{' '}
                <Link to="/login" style={{ fontWeight: 700, color: C.greenDark }}>Log in</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
