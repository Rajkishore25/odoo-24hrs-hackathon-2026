import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/api/client';

export interface AuthUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'PAYROLL_OFFICER' | 'LINE_MANAGER' | 'EMPLOYEE';
  employee?: {
    id: string;
    name: string;
    employeeCode: string;
    department?: string;
    designation?: string;
  } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'pp360-token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    api.get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        // Token is invalid or expired
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        delete api.defaults.headers.common['Authorization'];
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: authUser } = res.data.data;

    localStorage.setItem(TOKEN_KEY, accessToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setToken(accessToken);

    // Fetch full user profile
    const meRes = await api.get('/auth/me');
    setUser(meRes.data.data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
