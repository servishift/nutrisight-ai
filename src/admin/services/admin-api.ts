// Admin API service — all admin backend calls go through here
// Uses VITE_API_BASE_URL, falls back to mock data for UI development

import type { ManagedUser, Additive, DashboardStats, AnalyticsData, AuditLog } from '../types/admin';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

function authHeaders(): HeadersInit {
  const tokens = localStorage.getItem('foodintel_auth_tokens');
  const parsed = tokens ? JSON.parse(tokens) : null;
  return {
    'Content-Type': 'application/json',
    ...(parsed?.accessToken ? { Authorization: `Bearer ${parsed.accessToken}` } : {}),
  };
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  if (!BASE) throw new Error('API not configured — set VITE_API_BASE_URL');
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders(), ...opts });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `API ${res.status}`);
  }
  return res.json();
}

// ─── Dashboard ──────────────────────────────────────────
export const getDashboardStats = () => request<DashboardStats>('/api/admin/dashboard');

// ─── Users ──────────────────────────────────────────────
export const getUsers = (params?: { page?: number; search?: string; role?: string }) => {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.search) q.set('search', params.search);
  if (params?.role) q.set('role', params.role);
  return request<{ users: ManagedUser[]; total: number; page: number; pages: number }>(
    `/api/admin/users?${q.toString()}`
  );
};

export const getUser = (id: string) => request<ManagedUser>(`/api/admin/users/${id}`);

export const updateUser = (id: string, data: Partial<ManagedUser>) =>
  request<ManagedUser>(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const toggleUserStatus = (id: string) =>
  request<ManagedUser>(`/api/admin/users/${id}/toggle-status`, { method: 'POST' });

export const deleteUser = (id: string) =>
  request<void>(`/api/admin/users/${id}`, { method: 'DELETE' });

// ─── Additives ──────────────────────────────────────────
export const getAdditives = (params?: { page?: number; search?: string; category?: string }) => {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.search) q.set('search', params.search);
  if (params?.category) q.set('category', params.category);
  return request<{ additives: Additive[]; total: number; page: number; pages: number }>(
    `/api/admin/additives?${q.toString()}`
  );
};

export const createAdditive = (data: Omit<Additive, 'id' | 'createdAt' | 'updatedAt'>) =>
  request<Additive>('/api/admin/additives', { method: 'POST', body: JSON.stringify(data) });

export const updateAdditive = (id: string, data: Partial<Additive>) =>
  request<Additive>(`/api/admin/additives/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteAdditive = (id: string) =>
  request<void>(`/api/admin/additives/${id}`, { method: 'DELETE' });

// ─── Analytics ──────────────────────────────────────────
export const getAnalytics = (range: '7d' | '30d' | '90d' | '1y') =>
  request<AnalyticsData[]>(`/api/admin/analytics?range=${range}`);

// ─── Audit Logs ─────────────────────────────────────────
export const getAuditLogs = (page?: number) =>
  request<{ logs: AuditLog[]; total: number }>(`/api/admin/audit-logs?page=${page || 1}`);
