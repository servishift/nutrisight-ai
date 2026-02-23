# Phase 4 — SaaS API Reference

All endpoints require `Authorization: Bearer <accessToken>`.

---

## 1. API Key Management

### `GET /api/keys`
List all API keys for the authenticated user.

**Response `200`:**
```json
{
  "keys": [
    {
      "id": "uuid",
      "name": "Production App",
      "key": "fi_live_****7f3a",
      "prefix": "fi_live_",
      "environment": "live",
      "permissions": ["analyze", "similarity", "brand", "reformulation"],
      "createdAt": "2025-01-15T10:00:00Z",
      "lastUsedAt": "2025-02-22T14:32:00Z",
      "expiresAt": null,
      "isActive": true,
      "requestCount": 12847
    }
  ]
}
```

### `POST /api/keys`
Create a new API key.

**Request:**
```json
{
  "name": "My App",
  "environment": "live",
  "permissions": ["analyze", "similarity"]
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "My App",
  "key": "fi_live_sk_full_key_visible_once",
  "environment": "live",
  "permissions": ["analyze", "similarity"],
  "createdAt": "2025-02-23T10:00:00Z",
  "isActive": true
}
```

### `PATCH /api/keys/:id`
Toggle active state or update name/permissions.

### `DELETE /api/keys/:id`
Revoke and delete an API key.

---

## 2. API Usage & Analytics

### `GET /api/usage`
Get usage statistics.

**Query params:** `period=7d|30d|90d`

**Response `200`:**
```json
{
  "totalRequests": 14500,
  "requestsToday": 342,
  "requestsThisMonth": 8500,
  "averageLatencyMs": 87,
  "errorRate": 1.2,
  "topEndpoints": [
    { "endpoint": "/api/analyze", "count": 5420, "avgLatencyMs": 85 }
  ],
  "dailyUsage": [
    { "date": "2025-02-01", "requests": 450, "errors": 5 }
  ]
}
```

---

## 3. Webhooks

### `GET /api/webhooks`
List configured webhooks.

### `POST /api/webhooks`
Create a webhook.

**Request:**
```json
{
  "url": "https://myapp.com/webhooks/foodintel",
  "events": ["analysis.completed", "batch.completed"]
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "url": "https://myapp.com/webhooks/foodintel",
  "events": ["analysis.completed", "batch.completed"],
  "isActive": true,
  "secret": "whsec_full_secret_visible_once",
  "createdAt": "2025-02-23T10:00:00Z"
}
```

### `PATCH /api/webhooks/:id`
Update webhook URL, events, or active state.

### `DELETE /api/webhooks/:id`
Remove a webhook.

### Webhook Events
- `analysis.completed` — Single analysis finished
- `batch.completed` — Batch analysis finished
- `similarity.completed` — Similarity search done
- `brand.predicted` — Brand prediction done
- `reformulation.detected` — Reformulation comparison done
- `subscription.created` — New subscription
- `subscription.cancelled` — Subscription cancelled

### Webhook Payload
```json
{
  "event": "analysis.completed",
  "timestamp": "2025-02-23T10:00:00Z",
  "data": { ... }
}
```

All webhook deliveries include `X-FoodIntel-Signature` header for HMAC verification.

---

## 4. Database Tables (Phase 4)

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('live', 'test')),
  permissions TEXT[] NOT NULL DEFAULT '{"analyze"}',
  is_active BOOLEAN DEFAULT true,
  request_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id),
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_usage_logs_key ON api_usage_logs(api_key_id, created_at);
CREATE INDEX idx_webhooks_user ON webhooks(user_id);
```

---

## Python Dependencies (Phase 4)

```txt
flask-limiter>=3.5
redis>=5.0
celery>=5.3
gunicorn>=21.2
```
