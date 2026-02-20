# Admin Panel API Reference

All admin endpoints require a valid JWT with `role: admin` or `role: superadmin`.

**Base URL:** `{VITE_API_BASE_URL}`

**Auth header:** `Authorization: Bearer <admin_access_token>`

---

## Admin Authentication

### `POST /api/admin/login`
Admin-specific login. Returns tokens with admin role.

**Request:**
```json
{ "email": "admin@foodintel.ai", "password": "secure123" }
```

**Response (200):**
```json
{
  "user": { "id": "...", "email": "...", "displayName": "Admin", "role": "superadmin" },
  "tokens": { "accessToken": "...", "refreshToken": "...", "expiresAt": 1234567890 }
}
```

---

## Dashboard

### `GET /api/admin/dashboard`
Returns platform-wide statistics.

**Response (200):**
```json
{
  "totalUsers": 2847,
  "activeUsers": 1234,
  "totalAnalyses": 95000,
  "proSubscribers": 182,
  "revenueThisMonth": 5460,
  "userGrowth": 12.5,
  "analysisGrowth": 23.1
}
```

---

## User Management

### `GET /api/admin/users?page=1&search=sarah&role=pro`
Paginated user list with optional filters.

**Response (200):**
```json
{
  "users": [
    {
      "id": "...",
      "email": "sarah@example.com",
      "displayName": "Sarah Chen",
      "phone": null,
      "emailVerified": true,
      "isActive": true,
      "role": "user",
      "plan": "pro",
      "analysisCount": 245,
      "createdAt": "2025-01-15T00:00:00Z",
      "lastLoginAt": "2026-02-20T08:00:00Z"
    }
  ],
  "total": 2847,
  "page": 1,
  "pages": 285
}
```

### `GET /api/admin/users/:id`
Single user details.

### `PUT /api/admin/users/:id`
Update user fields (plan, role, isActive, displayName).

### `POST /api/admin/users/:id/toggle-status`
Toggle user active/inactive status.

### `DELETE /api/admin/users/:id`
Permanently delete a user (cascades Firebase + database).

---

## Additive Management

### `GET /api/admin/additives?page=1&search=E102&category=color`

**Response (200):**
```json
{
  "additives": [
    {
      "id": "...",
      "code": "E102",
      "name": "Tartrazine",
      "category": "color",
      "riskLevel": "high",
      "description": "Synthetic yellow dye",
      "source": "Synthetic",
      "bannedIn": ["Norway", "Austria"],
      "createdAt": "2025-01-10T00:00:00Z",
      "updatedAt": "2025-01-10T00:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 15
}
```

### `POST /api/admin/additives`
Create a new additive entry.

**Request:**
```json
{
  "code": "E100",
  "name": "Curcumin",
  "category": "color",
  "riskLevel": "low",
  "description": "Natural yellow colour from turmeric",
  "source": "Turmeric root",
  "bannedIn": []
}
```

### `PUT /api/admin/additives/:id`
Update an additive.

### `DELETE /api/admin/additives/:id`
Delete an additive.

---

## Analytics

### `GET /api/admin/analytics?range=7d`
Range options: `7d`, `30d`, `90d`, `1y`

**Response (200):**
```json
[
  { "date": "2026-02-14", "users": 42, "analyses": 320, "revenue": 120 },
  { "date": "2026-02-15", "users": 38, "analyses": 410, "revenue": 95 }
]
```

---

## Audit Logs

### `GET /api/admin/audit-logs?page=1`

**Response (200):**
```json
{
  "logs": [
    {
      "id": "...",
      "action": "user.deactivated",
      "targetType": "user",
      "targetId": "user-123",
      "adminId": "admin-1",
      "adminEmail": "admin@foodintel.ai",
      "details": "Deactivated user alex@example.com",
      "createdAt": "2026-02-19T16:12:00Z"
    }
  ],
  "total": 156
}
```

---

## Error Format

All errors return:
```json
{ "message": "Human-readable error description" }
```

| Status | Meaning |
|--------|---------|
| 401 | Missing or invalid token |
| 403 | Token valid but not admin role |
| 404 | Resource not found |
| 422 | Validation error |
| 500 | Server error |

---

## Implementation Notes

1. **Admin role check**: Middleware must verify `role` in JWT payload is `admin` or `superadmin`
2. **Audit logging**: Every write operation should create an audit log entry
3. **Pagination**: Default 10 items/page, max 100
4. **Additive categories**: `preservative | color | sweetener | emulsifier | antioxidant | flavor | stabilizer | other`
5. **Risk levels**: `low | moderate | high`
