import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, AuthTokens, AuthStatus } from '@/types/auth';
import * as authService from '@/services/auth-service';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Restore session on mount
    const stored = authService.getStoredUser();
    const tokens = authService.getStoredTokens();
    if (stored && tokens) {
      setUser(stored);
      setStatus('authenticated');
    } else {
      setStatus('unauthenticated');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setStatus('loading');
    setError(null);
    try {
      const result = await authService.login({ email, password });
      authService.storeTokens(result.tokens);
      authService.storeUser(result.user);
      setUser(result.user);
      setStatus('authenticated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setStatus('unauthenticated');
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    setStatus('loading');
    setError(null);
    try {
      await authService.register({ email, password, displayName });
      // After register, user needs to verify OTP before being authenticated
      setStatus('unauthenticated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setStatus('unauthenticated');
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        error,
        isAuthenticated: status === 'authenticated',
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
