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
  const [authState, setAuthState] = useState<AuthState>({
    token: null, role: null, userId: null, fullName: null,
  });

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const role     = localStorage.getItem('role') as Role | null;
    const userId   = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');
    if (token && role && userId && fullName) {
      setAuthState({ token, role, userId: Number(userId), fullName });
    }
    setLoading(false);
  }, []);

  const login = (response: LoginResponse) => {
    localStorage.setItem('token',    response.token);
    localStorage.setItem('role',     response.role);
    localStorage.setItem('userId',   String(response.userId));
    localStorage.setItem('fullName', response.fullName);
    setAuthState({ token: response.token, role: response.role, userId: response.userId, fullName: response.fullName });
  };

  const logout = () => {
    ['token', 'role', 'userId', 'fullName'].forEach(k => localStorage.removeItem(k));
    setAuthState({ token: null, role: null, userId: null, fullName: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
