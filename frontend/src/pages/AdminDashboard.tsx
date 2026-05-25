import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/api';
import type { AdminUser, AdminStats } from '../types';
import { AxiosError } from 'axios';
import Sidebar from '../components/Sidebar';

type Tab = 'overview' | 'pending' | 'users';

export default function AdminDashboard() {
  const { fullName, logout } = useAuth();
  const [tab,      setTab]      = useState<Tab>('overview');
  const [stats,    setStats]    = useState<AdminStats | null>(null);
  const [pending,  setPending]  = useState<AdminUser[]>([]);
  const [users,    setUsers]    = useState<AdminUser[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [message,  setMessage]  = useState('');
  const [error,    setError]    = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [sr, pr] = await Promise.all([adminService.getStats(), adminService.getPendingUsers()]);
        setStats(sr.data);
        setPending(pr.data);
      } catch (e) {
        const err = e as AxiosError<{error?:string}>;
        setError(err.response?.data?.error ?? 'Failed to load dashboard');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const loadUsers = async () => {
    if (users.length > 0) return;
    try {
      const r = await adminService.getAllUsers();
      setUsers(r.data);
    } catch (e) { /* silent */ }
  };

  const handleApprove = async (userId: number, name: string) => {
    try {
      const r = await adminService.approveUser(userId);
      setMessage(r.data.message);
      setPending(p => p.filter(u => u.id !== userId));
      setUsers(p => p.map(u => u.id === userId ? { ...u, approved: true } : u));
      if (stats) setStats({ ...stats, pendingUsers: stats.pendingUsers - 1 });
    } catch (e) {
      const err = e as AxiosError<{error?:string}>;
      setError(err.response?.data?.error ?? `Failed to approve ${name}`);
    }
  };

  const handleReject = async (userId: number, name: string) => {
    if (!window.confirm(`Reject/disable ${name}?`)) return;
    try {
      const r = await adminService.rejectUser(userId);
      setMessage(r.data.message);
      setPending(p => p.filter(u => u.id !== userId));
      setUsers(p => p.map(u => u.id === userId ? { ...u, approved: false } : u));
    } catch (e) {
      const err = e as AxiosError<{error?:string}>;
      setError(err.response?.data?.error ?? `Failed to reject ${name}`);
    }
  };

  const roleBadge = (role: string) => {
    if (role === 'ADMIN')      return <span className="badge badge-red">Admin</span>;
    if (role === 'INSTRUCTOR') return <span className="badge badge-yellow">Instructor</span>;
    return <span className="badge badge-green">Student</span>;
  };

  return (
    <main className="page inner-page" style={{ paddingTop: 0 }}>
      <Sidebar />
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-heading">Admin Panel</h1>
          <p className="dashboard-sub">Welcome, {fullName} 👋</p>
        </div>
        <button className="secondary-btn btn-sm"
          style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} onClick={logout}>Log Out</button>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 'var(--max-width)', margin: '20px auto 0', display: 'flex', gap: 8 }}>
        {(['overview', 'pending', 'users'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === 'users') loadUsers(); }}
            style={{
              padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
              background: tab === t ? 'var(--black)' : '#fff',
              color: tab === t ? '#fff' : 'var(--black)',
              boxShadow: 'var(--card-shadow)',
            }}>
            {t === 'overview' ? 'Overview' : t === 'pending' ? `Pending (${pending.length})` : 'All Users'}
          </button>
        ))}
      </div>

      {loading && <div className="loading-wrap"><div className="loading-spinner" /><span>Loading...</span></div>}

      <div style={{ maxWidth: 'var(--max-width)', margin: '16px auto 0' }}>
        {message && <div className="alert alert-success">{message}</div>}
        {error   && <div className="alert alert-error">{error}</div>}
      </div>

      {/* OVERVIEW TAB */}
      {!loading && tab === 'overview' && stats && (
        <>
          <div className="stats-row">
            {[
              { num: stats.totalUsers,       label: 'Total Users' },
              { num: stats.pendingUsers,     label: 'Pending Approval' },
              { num: stats.publishedCourses, label: 'Published Courses' },
              { num: stats.totalEnrollments, label: 'Total Enrollments' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {pending.length > 0 && (
            <div style={{ maxWidth: 'var(--max-width)', margin: '24px auto 0' }}>
              <h2 style={{ fontFamily: "'Carter One', cursive", margin: '0 0 12px', fontSize: 22 }}>
                Pending Approvals
              </h2>
              <div className="table-wrap">
                <table className="fold-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.fullName}</strong></td>
                        <td style={{ color: 'var(--gray)' }}>{u.email}</td>
                        <td>{roleBadge(u.role)}</td>
                        <td style={{ fontSize: 12, color: 'var(--gray)' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="primary-btn btn-sm"
                              onClick={() => handleApprove(u.id, u.fullName)}>Approve</button>
                            <button className="danger-btn btn-sm"
                              onClick={() => handleReject(u.id, u.fullName)}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pending.length === 0 && (
            <div style={{ maxWidth: 'var(--max-width)', margin: '24px auto 0' }}>
              <div className="alert alert-success">✓ No pending approvals</div>
            </div>
          )}
        </>
      )}

      {/* PENDING TAB */}
      {!loading && tab === 'pending' && (
        <div style={{ maxWidth: 'var(--max-width)', margin: '16px auto 0' }}>
          {pending.length === 0
            ? <div className="alert alert-success">✓ No accounts are pending approval.</div>
            : (
              <div className="table-wrap">
                <table className="fold-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {pending.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.fullName}</strong></td>
                        <td style={{ color: 'var(--gray)' }}>{u.email}</td>
                        <td>{roleBadge(u.role)}</td>
                        <td style={{ fontSize: 12, color: 'var(--gray)' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="primary-btn btn-sm"
                              onClick={() => handleApprove(u.id, u.fullName)}>Approve</button>
                            <button className="danger-btn btn-sm"
                              onClick={() => handleReject(u.id, u.fullName)}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* ALL USERS TAB */}
      {!loading && tab === 'users' && (
        <div style={{ maxWidth: 'var(--max-width)', margin: '16px auto 0' }}>
          {users.length === 0
            ? <div className="loading-wrap"><div className="loading-spinner" /></div>
            : (
              <div className="table-wrap">
                <table className="fold-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.fullName}</strong></td>
                        <td style={{ color: 'var(--gray)', fontSize: 13 }}>{u.email}</td>
                        <td>{roleBadge(u.role)}</td>
                        <td>
                          <span className={`badge ${u.approved ? 'badge-green' : 'badge-yellow'}`}>
                            {u.approved ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--gray)' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {!u.approved && (
                              <button className="primary-btn btn-sm"
                                onClick={() => handleApprove(u.id, u.fullName)}>Approve</button>
                            )}
                            {u.approved && (
                              <button className="danger-btn btn-sm"
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
        </div>
      )}
    </main>
  );
}
