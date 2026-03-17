// Phase 4 API service — API Keys, Usage, Webhooks, Playground

import { API_BASE } from '@/services/api-base';

async function apiFetch<T>(path: string, method: string = 'GET', body?: unknown): Promise<T> {
  // Get token from auth service instead of direct localStorage access
  const tokens = JSON.parse(localStorage.getItem('foodintel_auth_tokens') || 'null');
  const token = tokens?.accessToken;
  
  if (!token) {
    throw new Error('Please login to access this feature');
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Error ${res.status}` }));
    throw new Error(err.message || `API error: ${res.status}`);
  }
  return res.json();
}

// API Keys
export async function createApiKey(name: string, tier: string = 'free') {
  return apiFetch('/api/phase4/keys', 'POST', { name, tier });
}

export async function listApiKeys() {
  return apiFetch('/api/phase4/keys', 'GET');
}

export async function revokeApiKey(keyId: string) {
  return apiFetch(`/api/phase4/keys/${keyId}`, 'DELETE');
}

// Usage Analytics
export async function getUsageAnalytics(hours: number = 24) {
  return apiFetch(`/api/phase4/usage?hours=${hours}`, 'GET');
}

// Webhooks
export async function createWebhook(url: string, events: string[]) {
  return apiFetch('/api/phase4/webhooks', 'POST', { url, events });
}

export async function listWebhooks() {
  return apiFetch('/api/phase4/webhooks', 'GET');
}

export async function deleteWebhook(webhookId: string) {
  return apiFetch(`/api/phase4/webhooks/${webhookId}`, 'DELETE');
}

// Playground
export async function playgroundAnalyze(ingredients: string) {
  return apiFetch('/api/phase4/playground/analyze', 'POST', { ingredients });
}

export async function playgroundSimilarity(ingredients: string) {
  return apiFetch('/api/phase4/playground/similarity', 'POST', { ingredients });
}

export async function playgroundBrand(ingredients: string) {
  return apiFetch('/api/phase4/playground/brand', 'POST', { ingredients });
}
