// Auth types — Firebase-ready, no vendor lock-in

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface OTPVerifyRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
}

export type OAuthProvider = 'google' | 'github' | 'facebook';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  status: AuthStatus;
  error: string | null;
}
