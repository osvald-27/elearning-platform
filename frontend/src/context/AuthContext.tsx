import { createContext, useContext, useState, ReactNode } from 'react';
import { Role } from '../types';

interface AuthState {
  token: string | null;
  role: Role | null;
  userId: number | null;
  login: (token: string, role: Role, userId: number) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthState>({} as AuthState);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token,  setToken]  = useState<string | null>(null);
  const [role,   setRole]   = useState<Role | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const login = (t: string, r: Role, id: number) => {
    setToken(t);
    setRole(r);
    setUserId(id);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
