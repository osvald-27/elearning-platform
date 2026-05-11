import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function InstructorDashboard() {
  const { fullName, logout } = useAuth();
  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Instructor Dashboard</h1>
        <p style={s.welcome}>Welcome, {fullName} 👋</p>
        <p style={s.note}>More features coming in Sprint 2.</p>
        <button style={s.btn} onClick={logout}>Log Out</button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' },
  card:    { background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '420px', width: '100%' },
  title:   { margin: 0, color: '#1a1a2e' },
  welcome: { fontSize: '1.1rem', margin: '0.75rem 0 0.5rem' },
  note:    { color: '#888', fontSize: '0.9rem' },
  btn:     { marginTop: '1.5rem', padding: '0.6rem 1.5rem', background: '#c0392b', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 600 },
};
