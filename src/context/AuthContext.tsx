import React, { createContext, useContext, useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://multi-clinic-token-management.onrender.com' : '');

export interface AuthUser {
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'CLINIC_ADMIN';
  clinicId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  clinic: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isSuperAdmin: boolean;
  isClinicAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [clinic,  setClinic]  = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const { token: t, user: u, clinic: c } = JSON.parse(stored);
        setToken(t); setUser(u); setClinic(c);
      } catch { localStorage.removeItem('auth'); }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error || 'Login failed');
    }
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    setClinic(data.clinic);
    localStorage.setItem('auth', JSON.stringify({ token: data.token, user: data.user, clinic: data.clinic }));
  };

  const logout = () => {
    setToken(null); setUser(null); setClinic(null);
    localStorage.removeItem('auth');
    // Also clear legacy key
    localStorage.removeItem('adminLoggedIn');
  };

  return (
    <AuthContext.Provider value={{
      user, token, clinic, loading,
      login, logout,
      isSuperAdmin: user?.role === 'SUPER_ADMIN',
      isClinicAdmin: user?.role === 'CLINIC_ADMIN',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Helper to get auth headers for fetch calls
export function authHeaders(token: string | null): Record<string, string> {
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
               : { 'Content-Type': 'application/json' };
}
