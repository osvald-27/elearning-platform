import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { token, role, logout } = useAuth();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dashboardPath = role === 'STUDENT'
    ? '/student/dashboard'
    : role === 'INSTRUCTOR'
    ? '/instructor/dashboard'
    : '/admin/dashboard';

  return (
    <>
      <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>

      <aside ref={sidebarRef} className={`sidebar ${open ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setOpen(false)} aria-label="Close menu">✕</button>
        <nav className="sidebar-nav">
          <Link to="/" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/courses" onClick={() => setOpen(false)}>Courses</Link>
          <Link to="/about" onClick={() => setOpen(false)}>About</Link>
          <hr className="sidebar-divider" />
          {token ? (
            <>
              <Link to={dashboardPath} onClick={() => setOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
              <Link to="/get-started" onClick={() => setOpen(false)}>Sign Up</Link>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
