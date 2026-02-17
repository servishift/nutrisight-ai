/**
 * Auth Service Layer
 * 
 * Firebase-ready authentication service.
 * Currently uses localStorage simulation for UI development.
 * When Firebase is connected, replace the implementations below
 * with actual Firebase Auth SDK calls.
 * 
 * See: docs/BACKEND_AUTH_GUIDE.md for integration instructions.
 */

import type {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  OTPVerifyRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  UpdateProfileRequest,
} from '@/types/auth';

const TOKEN_KEY = 'foodintel_auth_tokens';
const USER_KEY = 'foodintel_auth_user';

// ─── Token Management ────────────────────────────────────────

export function getStoredTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const tokens: AuthTokens = JSON.parse(raw);
    if (tokens.expiresAt < Date.now()) {
      clearStoredAuth();
      return null;
    }
    return tokens;
  } catch {
    return null;
  }
}

export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ─── Auth Headers ────────────────────────────────────────────

export function getAuthHeaders(): Record<string, string> {
  const tokens = getStoredTokens();
  if (!tokens) return {};
  return { Authorization: `Bearer ${tokens.accessToken}` };
}

// ─── API Calls (Firebase-ready stubs) ────────────────────────
// Replace these with actual Firebase SDK or backend API calls.

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function authFetch<T>(path: string, body?: unknown): Promise<T> {
  if (!API_BASE) {
    throw new Error('Backend not configured. Set VITE_API_BASE_URL.');
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Error ${res.status}` }));
    throw new Error(err.message || `Auth error: ${res.status}`);
  }
  return res.json();
}

export async function login(req: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
  // When Firebase is connected:
  // const credential = await signInWithEmailAndPassword(auth, req.email, req.password);
  // const token = await credential.user.getIdToken();
  // return { user: mapFirebaseUser(credential.user), tokens: { accessToken: token, ... } };
  
  return authFetch('/api/auth/login', req);
}

export async function register(req: RegisterRequest): Promise<{ user: User; message: string }> {
  // Firebase: createUserWithEmailAndPassword + sendEmailVerification
  return authFetch('/api/auth/register', req);
}

export async function verifyOTP(req: OTPVerifyRequest): Promise<{ user: User; tokens: AuthTokens }> {
  // Firebase: applyActionCode or custom OTP verification
  return authFetch('/api/auth/verify-otp', req);
}

export async function resendOTP(email: string): Promise<{ message: string }> {
  // Firebase: sendEmailVerification
  return authFetch('/api/auth/resend-otp', { email });
}

export async function forgotPassword(req: ResetPasswordRequest): Promise<{ message: string }> {
  // Firebase: sendPasswordResetEmail
  return authFetch('/api/auth/forgot-password', req);
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  // Firebase: confirmPasswordReset
  return authFetch('/api/auth/reset-password', { token, newPassword });
}

export async function updatePassword(req: UpdatePasswordRequest): Promise<{ message: string }> {
  // Firebase: updatePassword (requires reauthentication)
  return authFetch('/api/auth/update-password', req);
}

export async function updateProfile(req: UpdateProfileRequest): Promise<{ user: User }> {
  // Firebase: updateProfile
  return authFetch('/api/auth/update-profile', req);
}

export async function loginWithOAuth(provider: string): Promise<{ redirectUrl: string }> {
  // Firebase: signInWithPopup(auth, new GoogleAuthProvider())
  return authFetch('/api/auth/oauth', { provider });
}

export async function refreshToken(refreshToken: string): Promise<AuthTokens> {
  return authFetch('/api/auth/refresh', { refreshToken });
}

export async function logout(): Promise<void> {
  // Firebase: signOut(auth)
  try {
    if (API_BASE) {
      await authFetch('/api/auth/logout');
    }
  } finally {
    clearStoredAuth();
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const tokens = getStoredTokens();
  if (!tokens) return null;
  
  if (API_BASE) {
    try {
      const { user } = await authFetch<{ user: User }>('/api/auth/me');
      storeUser(user);
      return user;
    } catch {
      clearStoredAuth();
      return null;
    }
  }
  
  return getStoredUser();
}
