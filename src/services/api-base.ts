export function getApiBaseUrl(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  if (!envBase) {
    return '';
  }

  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';

  // In production containerized deployment, we expect nginx reverse proxy and relative calls.
  if (!isLocalhost && envBase.includes('localhost')) {
    return '';
  }

  return envBase;
}

export const API_BASE = getApiBaseUrl();
