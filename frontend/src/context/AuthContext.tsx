import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, LoginResponse, Role } from '../types';

interface AuthContextValue extends AuthState {
  login: (response: LoginResponse) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>({ token: null, role: null, userId: null, fullName: null });

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const role     = localStorage.getItem('role') as Role | null;
    const userId   = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');
    if (token && role && userId && fullName) setAuthState({ token, role, userId: Number(userId), fullName });
    setLoading(false);
  }, []);

  const login = (r: LoginResponse) => {
    localStorage.setItem('token', r.token);
    localStorage.setItem('role', r.role);
    localStorage.setItem('userId', String(r.userId));
    localStorage.setItem('fullName', r.fullName);
    setAuthState({ token: r.token, role: r.role, userId: r.userId, fullName: r.fullName });
  };

  const logout = () => {
    ['token','role','userId','fullName'].forEach(k => localStorage.removeItem(k));
    setAuthState({ token: null, role: null, userId: null, fullName: null });
  };

  return <AuthContext.Provider value={{ ...authState, login, logout, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
