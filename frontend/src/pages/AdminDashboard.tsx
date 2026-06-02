import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────
interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  approved: boolean;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  pendingUsers: number;
}

// ─── API helpers (inline — no extra service file needed) ─────────────────
const BASE = '/api';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

async function apiFetch<T>(url: string, method = 'GET'): Promise<T> {
  const res = await fetch(`${BASE}${url}`, { method, headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Component ─────────────────────────────────────────────────────────────
type Tab = 'overview' | 'pending' | 'all';

export default function AdminDashboard() {
  const { fullName, logout } = useAuth();
  const [tab,     setTab]     = useState<Tab>('overview');
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [pending, setPending] = useState<AdminUser[]>([]);
  const [allUsers,setAllUsers]= useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error,   setError]   = useState('');

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

  const handleApprove = async (userId: number, name: string) => {
    setMessage(''); setError('');
    try {
      const data = await apiFetch<{ message: string }>(`/admin/users/${userId}/approve`, 'PATCH');
      setMessage(data.message);
      // Remove from pending list; update in allUsers list
      setPending(p => p.filter(u => u.id !== userId));
      setAllUsers(p => p.map(u => u.id === userId ? { ...u, approved: true } : u));
      setStats(s => s ? { ...s, pendingUsers: Math.max(0, s.pendingUsers - 1) } : s);
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
      setPending(p => p.filter(u => u.id !== userId));
      setAllUsers(p => p.map(u => u.id === userId ? { ...u, approved: false } : u));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `Failed to reject ${name}`);
    }
  };

  const rolePill = (role: string) => {
    const colours: Record<string, { bg: string; text: string }> = {
      ADMIN:      { bg: '#fdecea', text: '#c0392b' },
      INSTRUCTOR: { bg: '#fff8e1', text: '#e65100' },
      STUDENT:    { bg: '#e8f5e9', text: '#2e7d32' },
    };
    const c = colours[role] ?? colours.STUDENT;
    return (
      <span style={{ ...s.pill, background: c.bg, color: c.text }}>{role}</span>
    );
  };

  const statusPill = (approved: boolean) => (
    <span style={{ ...s.pill,
      background: approved ? '#e8f5e9' : '#fff8e1',
      color: approved ? '#2e7d32' : '#e65100' }}>
      {approved ? 'Active' : 'Pending'}
    </span>
  );

  return (
    <div style={s.page}>
      {/* ── HEADER ──────────────────────────────────── */}
      <div style={s.header}>
        <div>
          <h1 style={s.heading}>Admin Panel</h1>
          <p style={s.sub}>Welcome, {fullName} 👋</p>
        </div>
        <button style={s.logoutBtn} onClick={logout}>Log Out</button>
      </div>

      {/* ── TABS ────────────────────────────────────── */}
      <div style={s.tabRow}>
        {(['overview', 'pending', 'all'] as Tab[]).map(t => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
            onClick={() => {
              setTab(t);
              setMessage(''); setError('');
              if (t === 'all' && allUsers.length === 0) loadAllUsers();
            }}>
            {t === 'overview' ? 'Overview'
              : t === 'pending' ? `Pending Approval (${pending.length})`
              : 'All Users'}
          </button>
        ))}
      </div>

      {/* ── FEEDBACK ────────────────────────────────── */}
      <div style={s.content}>
        {message && <div style={s.alertSuccess}>{message}</div>}
        {error   && <div style={s.alertError}>{error}</div>}

        {loading && (
          <div style={s.center}><div style={s.spinner} /><span style={{ color: '#888' }}>Loading...</span></div>
        )}

        {/* ── OVERVIEW ────────────────────────────── */}
        {!loading && tab === 'overview' && (
          <>
            {stats && (
              <div style={s.statsRow}>
                <div style={s.statCard}>
                  <div style={s.statNum}>{stats.totalUsers}</div>
                  <div style={s.statLabel}>Total Users</div>
                </div>
                <div style={s.statCard}>
                  <div style={{ ...s.statNum, color: stats.pendingUsers > 0 ? '#e65100' : '#2e7d32' }}>
                    {stats.pendingUsers}
                  </div>
                  <div style={s.statLabel}>Pending Approval</div>
                </div>
              </div>
            )}

            <h2 style={s.sectionTitle}>
              Pending Approvals
              {pending.length === 0 && <span style={s.allClear}> — all clear ✓</span>}
            </h2>

            {pending.length > 0 && (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>{['Name','Email','Role','Registered','Actions'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {pending.map((u, i) => (
                      <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={s.td}><strong>{u.fullName}</strong></td>
                        <td style={{ ...s.td, color: '#666', fontSize: 13 }}>{u.email}</td>
                        <td style={s.td}>{rolePill(u.role)}</td>
                        <td style={{ ...s.td, fontSize: 12, color: '#888' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={s.approveBtn}
                              onClick={() => handleApprove(u.id, u.fullName)}>Approve</button>
                            <button style={s.rejectBtn}
                              onClick={() => handleReject(u.id, u.fullName)}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── PENDING TAB ─────────────────────────── */}
        {!loading && tab === 'pending' && (
          <>
            <h2 style={s.sectionTitle}>Pending Accounts</h2>
            {pending.length === 0
              ? <div style={s.alertSuccess}>✓ No accounts are currently pending approval.</div>
              : (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>{['Name','Email','Role','Registered','Actions'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {pending.map((u, i) => (
                        <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={s.td}><strong>{u.fullName}</strong></td>
                          <td style={{ ...s.td, color: '#666', fontSize: 13 }}>{u.email}</td>
                          <td style={s.td}>{rolePill(u.role)}</td>
                          <td style={{ ...s.td, fontSize: 12, color: '#888' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button style={s.approveBtn}
                                onClick={() => handleApprove(u.id, u.fullName)}>Approve</button>
                              <button style={s.rejectBtn}
                                onClick={() => handleReject(u.id, u.fullName)}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </>
        )}

        {/* ── ALL USERS TAB ───────────────────────── */}
        {!loading && tab === 'all' && (
          <>
            <h2 style={s.sectionTitle}>All Users ({allUsers.length})</h2>
            {allUsers.length === 0
              ? <div style={s.center}><div style={s.spinner} /></div>
              : (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>{['Name','Email','Role','Status','Registered','Actions'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u, i) => (
                        <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={s.td}><strong>{u.fullName}</strong></td>
                          <td style={{ ...s.td, color: '#666', fontSize: 13 }}>{u.email}</td>
                          <td style={s.td}>{rolePill(u.role)}</td>
                          <td style={s.td}>{statusPill(u.approved)}</td>
                          <td style={{ ...s.td, fontSize: 12, color: '#888' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {!u.approved && (
                                <button style={s.approveBtn}
                                  onClick={() => handleApprove(u.id, u.fullName)}>Approve</button>
                              )}
                              {u.approved && (
                                <button style={s.rejectBtn}
                                  onClick={() => handleReject(u.id, u.fullName)}>Disable</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:       { minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: 48 },
  header:     { backgroundColor: '#1a1a2e', color: '#fff', padding: '20px 28px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  heading:    { margin: 0, fontSize: '1.4rem', fontWeight: 700 },
  sub:        { margin: '4px 0 0', fontSize: '0.875rem', opacity: 0.75 },
  logoutBtn:  { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                fontWeight: 600, fontSize: 14 },
  tabRow:     { display: 'flex', gap: 8, padding: '16px 28px', flexWrap: 'wrap' },
  tab:        { padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 14, background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  tabActive:  { background: '#1a1a2e', color: '#fff' },
  content:    { padding: '0 28px' },
  statsRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24,
                maxWidth: 560 },
  statCard:   { background: '#fff', borderRadius: 12, padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statNum:    { fontSize: 42, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 },
  statLabel:  { fontSize: 13, color: '#888', fontWeight: 600, marginTop: 6 },
  sectionTitle:{ fontWeight: 700, fontSize: 20, margin: '0 0 16px', color: '#1a1a2e' },
  allClear:   { fontWeight: 400, color: '#2e7d32', fontSize: 16 },
  tableWrap:  { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'auto' },
  table:      { width: '100%', borderCollapse: 'collapse', minWidth: 600 },
  th:         { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888',
                borderBottom: '1px solid #f0f0f0' },
  td:         { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid #f5f5f5' },
  pill:       { display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
                borderRadius: 999, fontSize: 12, fontWeight: 700 },
  approveBtn: { padding: '6px 14px', background: '#1a1a2e', color: '#fff', border: 'none',
                borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  rejectBtn:  { padding: '6px 14px', background: 'transparent', color: '#c0392b',
                border: '1.5px solid #c0392b', borderRadius: 6, cursor: 'pointer',
                fontWeight: 600, fontSize: 13 },
  alertSuccess:{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 8,
                 padding: '12px 16px', color: '#2e7d32', fontSize: 14, marginBottom: 16 },
  alertError: { background: '#fdecea', border: '1px solid #ef9a9a', borderRadius: 8,
                padding: '12px 16px', color: '#c0392b', fontSize: 14, marginBottom: 16 },
  center:     { display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 12, padding: 40, color: '#888' },
  spinner:    { width: 32, height: 32, border: '3px solid #e0e0e0',
                borderTopColor: '#1a1a2e', borderRadius: '50%',
                animation: 'spin 0.75s linear infinite' },
};
