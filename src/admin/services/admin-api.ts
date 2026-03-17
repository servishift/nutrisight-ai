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

export async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const headers = authHeaders();
  const res = await fetch(`${BASE}${path}`, { headers, ...opts });
  
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

export const createUser = (data: { email: string; password: string; displayName?: string; role?: string }) =>
  request<ManagedUser>('/api/admin/users', { method: 'POST', body: JSON.stringify(data) });

export const getUser = (id: string) => request<ManagedUser>(`/api/admin/users/${id}`);

export const updateUser = (id: string, data: Partial<ManagedUser>) =>
  request<ManagedUser>(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const toggleUserStatus = (id: string) =>
  request<ManagedUser>(`/api/admin/users/${id}/toggle-status`, { method: 'POST' });

export const deleteUser = (id: string) =>
  request<void>(`/api/admin/users/${id}`, { method: 'DELETE' });

export const exportUsers = async () => {
  const data = await getUsers();
  const csv = [
    ['Email', 'Name', 'Role', 'Status', 'Analyses', 'Created', 'Last Login'].join(','),
    ...data.users.map(u => [
      u.email,
      u.displayName || '',
      u.role,
      u.disabled ? 'Inactive' : 'Active',
      u.analysisCount,
      u.createdAt,
      u.lastLoginAt || 'Never'
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

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

export const getModelPerformance = () => request<any>('/api/admin/analytics/model-performance');

export const getTopAdditives = () => request<any>('/api/admin/analytics/top-additives');

// ─── Audit Logs ─────────────────────────────────────────
export const getAuditLogs = (page?: number) =>
  request<{ logs: AuditLog[]; total: number }>(`/api/admin/audit-logs?page=${page || 1}`);

// ─── Settings ───────────────────────────────────────────
export const getSettings = () => request<any>('/api/admin/settings');

export const updateSettings = (data: any) =>
  request<any>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) });

// ─── Marketing ──────────────────────────────────────────
export const getCoupons = (page?: number) =>
  request<{ coupons: any[]; total: number; page: number; pages: number }>(`/api/admin/marketing/coupons?page=${page || 1}`);

export const createCoupon = (data: any) =>
  request<any>('/api/admin/marketing/coupons', { method: 'POST', body: JSON.stringify(data) });

export const deleteCoupon = (id: string) =>
  request<void>(`/api/admin/marketing/coupons/${id}`, { method: 'DELETE' });

export const getEmailTemplates = (page?: number) =>
  request<{ templates: any[]; total: number; page: number; pages: number }>(`/api/admin/marketing/templates?page=${page || 1}`);

export const createEmailTemplate = (data: any) =>
  request<any>('/api/admin/marketing/templates', { method: 'POST', body: JSON.stringify(data) });

export const updateEmailTemplate = (id: string, data: any) =>
  request<any>(`/api/admin/marketing/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteEmailTemplate = (id: string) =>
  request<void>(`/api/admin/marketing/templates/${id}`, { method: 'DELETE' });

export const getActiveTemplate = (type: string) =>
  request<any>(`/api/admin/marketing/templates/active/${type}`);

export const getEmailCampaigns = (page?: number) =>
  request<{ campaigns: any[]; total: number; page: number; pages: number }>(`/api/admin/marketing/campaigns?page=${page || 1}`);

export const sendEmailCampaign = (data: any) =>
  request<{ message: string; recipientCount: number }>('/api/admin/marketing/campaigns', { method: 'POST', body: JSON.stringify(data) });

export const validateCoupon = (code: string, userId?: string) =>
  request<{ valid: boolean; code: string; discount: number; discountType: string }>('/api/admin/marketing/coupons/validate', { method: 'POST', body: JSON.stringify({ code, userId }) });

export const applyCoupon = (code: string, userId: string, orderAmount: number) =>
  request<{ originalAmount: number; discountAmount: number; finalAmount: number; couponCode: string }>('/api/admin/marketing/coupons/apply', { method: 'POST', body: JSON.stringify({ code, userId, orderAmount }) });

export const getCouponAnalytics = () =>
  request<{ totalCoupons: number; activeCoupons: number; totalRedemptions: number; topCoupons: any[] }>('/api/admin/marketing/analytics');

// ─── Content Management ─────────────────────────────────
export const getContentPages = (type?: string) =>
  request<any[]>(`/api/admin/content${type ? `?type=${type}` : ''}`);

export const getContentPage = (id: string) =>
  request<any>(`/api/admin/content/${id}`);

export const createContentPage = (data: any) =>
  request<any>('/api/admin/content', { method: 'POST', body: JSON.stringify(data) });

export const updateContentPage = (id: string, data: any) =>
  request<any>(`/api/admin/content/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteContentPage = (id: string) =>
  request<void>(`/api/admin/content/${id}`, { method: 'DELETE' });

// ─── Advanced Analytics & Reports ───────────────────────
export const getAdvancedAnalytics = () =>
  request<any>('/api/admin/reports/analytics');

export const exportAnalyticsReport = (format: string) =>
  request<any>(`/api/admin/reports/export?format=${format}`);

// ─── API Keys Management ────────────────────────────────
export const getAllApiKeys = () =>
  request<{ keys: any[] }>('/api/admin/api-keys');

export const revokeApiKey = (keyId: string) =>
  request<void>(`/api/admin/api-keys/${keyId}/revoke`, { method: 'POST' });

export const deleteApiKey = (keyId: string) =>
  request<void>(`/api/admin/api-keys/${keyId}`, { method: 'DELETE' });

// ─── Pricing Management ─────────────────────────────────
export const getPlatformPlans = () =>
  request<{ plans: Record<string, any> }>('/api/admin/pricing/platform');

export const updatePlatformPlan = (planId: string, data: { price?: number; limits?: Record<string, number> }) =>
  request<any>(`/api/admin/pricing/platform/${planId}`, { method: 'PUT', body: JSON.stringify(data) });

export const getApiPlansAdmin = () =>
  request<{ plans: Record<string, any> }>('/api/admin/pricing/api');

export const updateApiPlan = (planId: string, data: { price?: number; requests?: number; rate_limit?: number }) =>
  request<any>(`/api/admin/pricing/api/${planId}`, { method: 'PUT', body: JSON.stringify(data) });

export const adminApi = {
  getDashboardStats,
  getUsers,
  createUser,
  getUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  exportUsers,
  getAdditives,
  createAdditive,
  updateAdditive,
  deleteAdditive,
  getAnalytics,
  getModelPerformance,
  getTopAdditives,
  getAuditLogs,
  getSettings,
  updateSettings,
  getCoupons,
  createCoupon,
  deleteCoupon,
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getActiveTemplate,
  getEmailCampaigns,
  sendEmailCampaign,
  validateCoupon,
  applyCoupon,
  getCouponAnalytics,
  getContentPages,
  getContentPage,
  createContentPage,
  updateContentPage,
  deleteContentPage,
  getAdvancedAnalytics,
  exportAnalyticsReport,
  getAllApiKeys,
  revokeApiKey,
  deleteApiKey,
  getPlatformPlans,
  updatePlatformPlan,
  getApiPlansAdmin,
  updateApiPlan,
};