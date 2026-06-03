import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import type { NavItem } from '../components/DashboardShell';
import { C } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminUser {
  id:        number;
  fullName:  string;
  email:     string;
  role:      'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  approved:  boolean;
  createdAt: string;
}
interface Stats { totalUsers: number; pendingUsers: number; }

// ─── Inline API helpers (unchanged) ──────────────────────────────────────────
const BASE = '/api';
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : {};
}
async function apiFetch<T>(url: string, method = 'GET'): Promise<T> {
  const res = await fetch(`${BASE}${url}`, { method, headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as Record<string, string>).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'pending' | 'all';
const NAV: NavItem[] = [
  { key: 'overview', icon: '📊', label: 'Overview'         },
  { key: 'pending',  icon: '⏳', label: 'Pending Approval' },
  { key: 'all',      icon: '👥', label: 'All Users'        },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { fullName, logout } = useAuth();
  const navigate             = useNavigate();

  const [tab,      setTab]      = useState<Tab>('overview');
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [pending,  setPending]  = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [message,  setMessage]  = useState('');
  const [error,    setError]    = useState('');

  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, pendingData] = await Promise.all([
        apiFetch<Stats>('/admin/stats'),
        apiFetch<AdminUser[]>('/admin/pending-users'),
      ]);
      setStats(statsData);
      setPending(pendingData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllUsers = async () => {
    try {
      const data = await apiFetch<AdminUser[]>('/admin/users');
      setAllUsers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    }
  };

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Actions ── */
  const handleApprove = async (userId: number, name: string) => {
    setMessage(''); setError('');
    try {
      const data = await apiFetch<{ message: string }>(`/admin/users/${userId}/approve`, 'PATCH');
      setMessage(data.message);
      setPending((p) => p.filter((u) => u.id !== userId));
      setAllUsers((p) => p.map((u) => u.id === userId ? { ...u, approved: true } : u));
      setStats((s) => s ? { ...s, pendingUsers: Math.max(0, s.pendingUsers - 1) } : s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `Failed to approve ${name}`);
    }
  };

  const handleReject = async (userId: number, name: string) => {
    if (!window.confirm(`Reject / disable "${name}"? They will not be able to log in.`)) return;
    setMessage(''); setError('');
    try {
      const data = await apiFetch<{ message: string }>(`/admin/users/${userId}/reject`, 'PATCH');
      setMessage(data.message);
      setPending((p) => p.filter((u) => u.id !== userId));
      setAllUsers((p) => p.map((u) => u.id === userId ? { ...u, approved: false } : u));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `Failed to reject ${name}`);
    }
  };

  /* ── Pills ── */
  const rolePill = (role: string) => {
    const map: Record<string, [string, string]> = {
      ADMIN:      ['#fdecea', C.errorRed],
      INSTRUCTOR: ['#fff8e1', '#e65100'],
      STUDENT:    [C.lightGreen, C.greenDark],
    };
    const [bg, color] = map[role] ?? map.STUDENT;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 12px', borderRadius: 999,
        fontSize: 12, fontWeight: 700, background: bg, color,
      }}>{role}</span>
    );
  };

  const statusPill = (approved: boolean) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
      background: approved ? C.lightGreen : '#fff8e1',
      color: approved ? C.greenDark : '#e65100',
    }}>
      {approved ? 'Active' : 'Pending'}
    </span>
  );

  /* ── Shared sub-components ── */
  const card: React.CSSProperties = {
    background: C.white, borderRadius: 28,
    boxShadow: C.cardShadow, overflow: 'hidden',
  };

  const Spinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 56 }}>
      <div style={{
        width: 34, height: 34, border: `3px solid #e0e0e0`,
        borderTopColor: C.greenDark, borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }} />
      <span style={{ color: C.gray, fontSize: 14 }}>Loading…</span>
    </div>
  );

  const Alert = ({ type, text }: { type: 'success' | 'error'; text: string }) => (
    <div style={{
      padding: '12px 16px', borderRadius: 14, marginBottom: 16, fontSize: 14,
      display: 'flex', gap: 8, alignItems: 'flex-start',
      background: type === 'success' ? C.successBg  : C.errorBg,
      border: `1px solid ${type === 'success' ? C.successBorder : C.errorBorder}`,
      color:  type === 'success' ? C.greenDark : C.errorRed,
    }}>
      <span>{type === 'success' ? '✅' : '⚠️'}</span><span>{text}</span>
    </div>
  );

  const UsersTable = ({ users, showStatus }: { users: AdminUser[]; showStatus?: boolean }) => (
    <div style={{ ...card }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
          <thead>
            <tr style={{ background: C.grayLight }}>
              {['Name', 'Email', 'Role', ...(showStatus ? ['Status'] : []), 'Registered', 'Actions'].map((h) => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  color: C.gray, borderBottom: `1px solid #eee`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ background: i % 2 === 0 ? C.white : '#fafafa' }}>
                <td style={{ padding: '13px 16px', fontSize: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: C.lightGreen, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, flexShrink: 0,
                    }}>
                      {u.role === 'STUDENT' ? '🎓' : u.role === 'INSTRUCTOR' ? '📋' : '🛡️'}
                    </div>
                    <strong>{u.fullName}</strong>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: C.gray }}>{u.email}</td>
                <td style={{ padding: '13px 16px' }}>{rolePill(u.role)}</td>
                {showStatus && <td style={{ padding: '13px 16px' }}>{statusPill(u.approved)}</td>}
                <td style={{ padding: '13px 16px', fontSize: 12, color: C.gray }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!u.approved && (
                      <button
                        style={{
                          padding: '6px 16px', borderRadius: 999, border: 'none',
                          background: C.green, color: C.black,
                          fontWeight: 700, fontSize: 12, cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                        }}
                        onClick={() => handleApprove(u.id, u.fullName)}
                      >Approve</button>
                    )}
                    {u.approved && (
                      <button
                        style={{
                          padding: '6px 16px', borderRadius: 999,
                          border: `1.5px solid ${C.errorRed}`, background: 'transparent',
                          color: C.errorRed, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                        }}
                        onClick={() => handleReject(u.id, u.fullName)}
                      >Disable</button>
                    )}
                    {!u.approved && (
                      <button
                        style={{
                          padding: '6px 16px', borderRadius: 999,
                          border: `1.5px solid ${C.errorRed}`, background: 'transparent',
                          color: C.errorRed, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                        }}
                        onClick={() => handleReject(u.id, u.fullName)}
                      >Reject</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <DashboardShell
      fullName={fullName ?? 'Admin'}
      role="ADMIN"
      activeTab={tab}
      navItems={NAV}
      onTabChange={(k) => {
        setTab(k as Tab);
        setMessage(''); setError('');
        if (k === 'all' && allUsers.length === 0) loadAllUsers();
      }}
      onLogout={() => { logout(); navigate('/'); }}
    >
      {/* ── Feedback ──────────────────────────────── */}
      {message && <Alert type="success" text={message} />}
      {error   && <Alert type="error"   text={error}   />}

      {/* ── Loading ───────────────────────────────── */}
      {loading && <Spinner />}

      {/* ── OVERVIEW ─────────────────────────────── */}
      {!loading && tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'slideUp .35s ease' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 'clamp(26px,3vw,40px)' }}>
              Admin Panel
            </h1>
            <p style={{ margin: '8px 0 0', color: C.gray, fontSize: 15 }}>
              Welcome back, {fullName}. Here's the current platform status.
            </p>
          </div>

          {/* Stat cards */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, maxWidth: 560 }}>
              {[
                { value: stats.totalUsers,   label: 'Total Users',       icon: '👥', color: C.greenDark },
                {
                  value: stats.pendingUsers,
                  label: 'Pending Approval',
                  icon: '⏳',
                  color: stats.pendingUsers > 0 ? '#e65100' : C.greenDark,
                },
              ].map(({ value, label, icon, color }) => (
                <div key={label} style={{
                  background: C.white, borderRadius: 28, padding: '24px',
                  boxShadow: C.cardShadow, display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <span style={{ fontSize: 36 }}>{icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 42, fontWeight: 700, color, fontFamily: "'Carter One', cursive", lineHeight: 1 }}>
                      {value}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: C.gray, fontWeight: 600 }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending table preview */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 24 }}>
                Pending Approvals
                {pending.length === 0 && (
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15, color: C.greenDark, marginLeft: 10 }}>
                    — all clear ✓
                  </span>
                )}
              </h2>
              {pending.length > 0 && (
                <button
                  style={{
                    background: 'none', border: `1.5px solid ${C.greenDark}`,
                    borderRadius: 999, padding: '6px 16px',
                    color: C.greenDark, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onClick={() => setTab('pending')}
                >View all →</button>
              )}
            </div>
            {pending.length > 0 && <UsersTable users={pending} />}
          </div>
        </div>
      )}

      {/* ── PENDING TAB ──────────────────────────── */}
      {!loading && tab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp .35s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 32 }}>Pending Accounts</h2>
            <span style={{
              padding: '4px 14px', borderRadius: 999,
              background: pending.length > 0 ? '#fff8e1' : C.lightGreen,
              color: pending.length > 0 ? '#e65100' : C.greenDark,
              fontWeight: 700, fontSize: 13,
            }}>{pending.length} pending</span>
          </div>

          {pending.length === 0 ? (
            <div style={{
              background: C.white, borderRadius: 28, padding: '48px 40px',
              boxShadow: C.cardShadow, textAlign: 'center',
            }}>
              <p style={{ fontSize: 48, margin: '0 0 12px' }}>✅</p>
              <p style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 22 }}>
                No accounts pending
              </p>
              <p style={{ margin: '8px 0 0', color: C.gray, fontSize: 14 }}>
                All registrations have been reviewed.
              </p>
            </div>
          ) : (
            <UsersTable users={pending} />
          )}
        </div>
      )}

      {/* ── ALL USERS TAB ────────────────────────── */}
      {!loading && tab === 'all' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp .35s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "'Carter One', cursive", fontSize: 32 }}>
              All Users
            </h2>
            <span style={{
              padding: '4px 16px', borderRadius: 999,
              background: C.lightGreen, color: C.greenDark,
              fontWeight: 700, fontSize: 13,
            }}>{allUsers.length} total</span>
          </div>

          {allUsers.length === 0 ? (
            <div style={{
              background: C.white, borderRadius: 28, padding: '48px 40px',
              boxShadow: C.cardShadow, textAlign: 'center',
            }}>
              <div style={{
                width: 36, height: 36, border: `3px solid #e0e0e0`,
                borderTopColor: C.greenDark, borderRadius: '50%',
                animation: 'spin 0.75s linear infinite', margin: '0 auto',
              }} />
            </div>
          ) : (
            <UsersTable users={allUsers} showStatus />
          )}
        </div>
      )}
    </DashboardShell>
  );
}
