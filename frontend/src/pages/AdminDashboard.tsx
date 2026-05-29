import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/api';
import type { UserResponse } from '../types';

export default function AdminDashboard() {
  const { fullName, logout } = useAuth();
  const [instructors, setInstructors] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    try {
      const { data } = await adminService.getInstructors();
      setInstructors(data);
    } catch (err) {
      console.error('Failed to load instructors', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (id: number, currentApproved: boolean) => {
    try {
      if (currentApproved) {
        await adminService.revokeUser(id);
      } else {
        await adminService.approveUser(id);
      }
      loadInstructors();
    } catch (err) {
      alert('Action failed');
    }
  };

  return (
    <div style={s.page}>
      <div style={s.sidebar}>
        <h2 style={s.sideTitle}>Admin Panel</h2>
        <p style={s.sideUser}>{fullName}</p>
        <button style={s.logoutBtn} onClick={logout}>Log Out</button>
      </div>

      <div style={s.content}>
        <header style={s.header}>
          <h1>Instructor Management</h1>
        </header>

        {loading ? (
          <p>Loading instructors...</p>
        ) : (
          <div style={s.tableCard}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>ID</th>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map(instr => (
                  <tr key={instr.id} style={s.tr}>
                    <td style={s.td}>{instr.id}</td>
                    <td style={s.td}>{instr.fullName}</td>
                    <td style={s.td}>{instr.email}</td>
                    <td style={s.td}>
                      <span style={{
                        ...s.badge,
                        backgroundColor: instr.approved ? '#d4edda' : '#f8d7da',
                        color: instr.approved ? '#155724' : '#721c24'
                      }}>
                        {instr.approved ? 'Approved' : 'Pending/Revoked'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <button
                        style={{
                          ...s.actionBtn,
                          backgroundColor: instr.approved ? '#e74c3c' : '#2ecc71'
                        }}
                        onClick={() => handleToggleAccess(instr.id, instr.approved)}
                      >
                        {instr.approved ? 'Revoke Access' : 'Approve Access'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6' },
  sidebar: { width: '260px', backgroundColor: '#2c3e50', color: '#fff', padding: '2rem', display: 'flex', flexDirection: 'column' },
  sideTitle: { margin: '0 0 0.5rem', fontSize: '1.5rem' },
  sideUser: { opacity: 0.8, marginBottom: '2rem', fontSize: '0.9rem' },
  logoutBtn: { padding: '0.6rem', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: 'auto' },

  content: { flex: 1, padding: '2rem' },
  header: { marginBottom: '2rem' },
  tableCard: { backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid #eee', color: '#7f8c8d' },
  td: { padding: '1rem', borderBottom: '1px solid #eee', color: '#2c3e50' },
  tr: { transition: 'background 0.2s' },
  badge: { padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
  actionBtn: { padding: '0.4rem 0.8rem', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 },
};
