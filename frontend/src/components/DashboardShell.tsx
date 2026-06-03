import type React from 'react';
import { C } from '../theme';

export interface NavItem {
  label: string;
  icon:  string;
  key:   string;
}

interface DashboardShellProps {
  children:     React.ReactNode;
  fullName:     string;
  role:         string;
  activeTab:    string;
  navItems:     NavItem[];
  onTabChange:  (key: string) => void;
  onLogout:     () => void;
}

const roleColor: Record<string, string> = {
  ADMIN:      C.errorRed,
  INSTRUCTOR: '#e65100',
  STUDENT:    C.greenDark,
};

const roleLabel: Record<string, string> = {
  ADMIN:      'Administrator',
  INSTRUCTOR: 'Instructor',
  STUDENT:    'Student',
};

export default function DashboardShell({
  children, fullName, role, activeTab, navItems, onTabChange, onLogout,
}: DashboardShellProps) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>

      {/* ── Top header bar ─────────────────────────── */}
      <header style={{
        background: C.greenDeep, color: C.white,
        padding: '0 28px', height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)', flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Fold" style={{ height: 40, width: 'auto', filter: 'brightness(0) invert(1)' }} />
        </div>

        {/* User info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{fullName}</p>
            <p style={{
              margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: roleColor[role] ?? C.yellow, opacity: 0.9,
            }}>{roleLabel[role] ?? role}</p>
          </div>
          <button
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              color: C.white, padding: '8px 18px',
              borderRadius: 999, cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              transition: 'background .15s',
            }}
            onClick={onLogout}
          >Log Out</button>
        </div>
      </header>

      {/* ── Body (sidebar + content) ────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Sidebar nav */}
        <aside style={{
          width: 240, flexShrink: 0,
          background: C.white,
          borderRight: `1px solid rgba(0,0,0,0.06)`,
          padding: '32px 16px',
          display: 'flex', flexDirection: 'column', gap: 6,
          boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
        }}>
          {navItems.map((item) => {
            const isActive = item.key === activeTab;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 14,
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14,
                  background: isActive ? C.lightGreen : 'transparent',
                  color: isActive ? C.greenDark : C.gray,
                  transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 18, minWidth: 22, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '32px 28px', overflowY: 'auto', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
