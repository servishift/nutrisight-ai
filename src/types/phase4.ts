// Phase 4 — SaaS types

export interface ApiKey {
  id: string;
  name: string;
  key: string; // masked, e.g. "fi_live_****abcd"
  prefix: string;
  environment: 'live' | 'test';
  permissions: string[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  requestCount: number;
}

export interface ApiUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  averageLatencyMs: number;
  errorRate: number;
  topEndpoints: { endpoint: string; count: number; avgLatencyMs: number }[];
  dailyUsage: { date: string; requests: number; errors: number }[];
}

export interface DeploymentInfo {
  id: string;
  version: string;
  status: 'running' | 'deploying' | 'failed' | 'stopped';
  environment: 'production' | 'staging';
  provider: string;
  url: string;
  region: string;
  lastDeployed: string;
  uptime: number; // percentage
  healthCheck: 'healthy' | 'degraded' | 'down';
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string; // masked
  createdAt: string;
  lastTriggeredAt: string | null;
  successRate: number;
}

export interface ApiPlaygroundRequest {
  endpoint: string;
  method: 'GET' | 'POST';
  body?: string;
  headers?: Record<string, string>;
}

export interface ApiPlaygroundResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
  latencyMs: number;
}
