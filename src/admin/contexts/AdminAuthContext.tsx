import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AdminUser } from '../types/admin';

interface AdminAuthValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

const STORAGE_KEY = 'foodintel_admin';
const BASE = import.meta.env.VITE_API_BASE_URL || '';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setAdmin(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      if (BASE) {
        const res = await fetch(`${BASE}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ message: 'Login failed' }));
          throw new Error(body.message);
        }
        const data = await res.json();
        localStorage.setItem('foodintel_auth_tokens', JSON.stringify(data.tokens));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        setAdmin(data.user);
      } else {
        // Demo mode — no backend
        const demo: AdminUser = { id: 'demo', email, displayName: 'Admin', role: 'superadmin' };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
        setAdmin(demo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('foodintel_auth_tokens');
    setAdmin(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AdminAuthContext.Provider value={{ admin, isAuthenticated: !!admin, loading, error, login, logout, clearError }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
