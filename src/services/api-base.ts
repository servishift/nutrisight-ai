/**
 * Resolves the backend API base URL.
 *
 * Local dev:   set VITE_API_BASE_URL=http://localhost:5000 in .env.local
 * Vercel:      set VITE_API_BASE_URL=https://your-backend-server.com in Vercel env vars
 * Docker:      VITE_API_BASE_URL="" — nginx proxies /api/ to backend container
 */
export function getApiBaseUrl(): string {
  const env = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  return env;
}

export const API_BASE = getApiBaseUrl();
