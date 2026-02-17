# Frontend–Backend Integration Contract

This document describes exactly what the frontend expects from the backend.

---

## How the Frontend Switches to Backend

In `src/services/api.ts`, the `analyzeIngredients()` function checks for `VITE_API_BASE_URL`:

```
if (BASE_URL) → fetch from backend
else → run local analysis (client-side fallback)
```

To enable backend mode, set the environment variable:
```
VITE_API_BASE_URL=https://your-api-domain.com
```

---

## Auth Service (`src/services/auth-service.ts`)

All auth functions call `POST ${VITE_API_BASE_URL}/api/auth/*`.

Every authenticated request sends:
```
Authorization: Bearer <accessToken>
```

Tokens are stored in `localStorage` under keys:
- `foodintel_auth_tokens` — `{ accessToken, refreshToken, expiresAt }`
- `foodintel_auth_user` — User object

The frontend checks token expiry on page load. If expired, it clears auth state.

---

## What Frontend Expects

### Successful responses
- HTTP `200` or `201`
- JSON body matching the types defined in `src/types/auth.ts` and `src/types/ingredient.ts`

### Error responses
- HTTP `4xx` or `5xx`
- JSON body: `{ "message": "string" }`
- The `message` field is displayed directly to the user

### CORS
- The backend MUST accept `Authorization` and `Content-Type` headers
- The backend MUST allow the frontend origin

---

## Auth Flow — Step by Step

### Registration
1. User fills form → frontend calls `POST /api/auth/register`
2. Backend creates Firebase user, sends verification email
3. Frontend redirects to `/verify-otp` with `email` in route state

### OTP Verification
1. User enters 6-digit code → frontend calls `POST /api/auth/verify-otp`
2. Backend verifies code, returns `{ user, tokens }`
3. Frontend stores tokens and redirects to `/analyzer`

### Login
1. User enters credentials → frontend calls `POST /api/auth/login`
2. Backend verifies with Firebase, returns `{ user, tokens }`
3. Frontend stores tokens and redirects

### Password Reset
1. User enters email → `POST /api/auth/forgot-password`
2. Backend sends reset email with link containing `?token=xyz`
3. User clicks link → arrives at `/reset-password?token=xyz`
4. User enters new password → `POST /api/auth/reset-password`

### Token Refresh
- Frontend does NOT auto-refresh (yet)
- If token is expired on page load, user is logged out
- Backend should support refresh via `POST /api/auth/refresh`

---

## Stripe Integration (Phase 2)

The frontend has placeholder UI for subscriptions. When Stripe is integrated:

1. Backend creates Stripe Checkout Session
2. Frontend redirects to Stripe
3. Stripe redirects back to frontend with session ID
4. Backend webhook updates user subscription status
5. Frontend checks `GET /api/subscription/status` for access control

---

## File Reference

| Frontend File                        | Purpose                           |
|--------------------------------------|-----------------------------------|
| `src/services/auth-service.ts`       | All auth API calls                |
| `src/services/api.ts`               | Analysis API calls                |
| `src/types/auth.ts`                 | Auth type definitions             |
| `src/types/ingredient.ts`           | Analysis type definitions         |
| `src/contexts/AuthContext.tsx`       | React auth state provider         |
| `src/components/auth/ProtectedRoute.tsx` | Route guard component         |
| `src/components/auth/OAuthButtons.tsx`   | OAuth sign-in buttons         |
