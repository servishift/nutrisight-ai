# API Endpoint Reference

Complete contract between the FoodIntel AI frontend and backend.

## Base URL

Set via `VITE_API_BASE_URL` environment variable.

---

## Auth Endpoints

### POST `/api/auth/register`

Register a new user account. Sends OTP verification email.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "Jane Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "uid": "firebase-uid-123",
    "email": "user@example.com",
    "displayName": "Jane Doe",
    "photoURL": null,
    "emailVerified": false,
    "phoneNumber": null,
    "createdAt": "2026-02-17T10:00:00Z",
    "lastLoginAt": "2026-02-17T10:00:00Z"
  },
  "message": "Verification email sent"
}
```

---

### POST `/api/auth/login`

Authenticate with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": { "...User object" },
  "tokens": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "dGhpcyBpcyBh...",
    "expiresAt": 1739800000000
  }
}
```

**Error (401):**
```json
{ "message": "Invalid email or password" }
```

---

### POST `/api/auth/verify-otp`

Verify email with 6-digit OTP code.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "482913"
}
```

**Response (200):**
```json
{
  "user": { "...User object (emailVerified: true)" },
  "tokens": { "...AuthTokens" }
}
```

---

### POST `/api/auth/resend-otp`

Resend verification OTP.

**Request:**
```json
{ "email": "user@example.com" }
```

**Response (200):**
```json
{ "message": "Verification code resent" }
```

---

### POST `/api/auth/forgot-password`

Send password reset email.

**Request:**
```json
{ "email": "user@example.com" }
```

**Response (200):**
```json
{ "message": "Password reset email sent" }
```

---

### POST `/api/auth/reset-password`

Reset password using token from email link.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{ "message": "Password updated successfully" }
```

---

### POST `/api/auth/update-password`

Change password for authenticated user.

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword456"
}
```

**Response (200):**
```json
{ "message": "Password changed successfully" }
```

---

### POST `/api/auth/update-profile`

Update user profile details.

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "displayName": "Jane Smith",
  "phoneNumber": "+15550001234"
}
```

**Response (200):**
```json
{
  "user": { "...updated User object" }
}
```

---

### POST `/api/auth/oauth`

Initiate OAuth login.

**Request:**
```json
{ "provider": "google" }
```

**Response (200):**
```json
{ "redirectUrl": "https://accounts.google.com/o/oauth2/..." }
```

---

### POST `/api/auth/refresh`

Refresh access token.

**Request:**
```json
{ "refreshToken": "dGhpcyBpcyBh..." }
```

**Response (200):**
```json
{
  "accessToken": "new-jwt...",
  "refreshToken": "new-refresh...",
  "expiresAt": 1739900000000
}
```

---

### POST `/api/auth/logout`

Invalidate session.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{ "message": "Logged out" }
```

---

### GET `/api/auth/me`

Get current authenticated user.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "user": { "...User object" }
}
```

---

## Analysis Endpoints

### POST `/api/analyze`

Full ingredient analysis.

**Auth:** Not required (Phase 1)

**Request:**
```json
{ "ingredientText": "wheat flour, sugar, palm oil, milk powder, salt, sodium benzoate" }
```

**Response (200):**
```json
{
  "allergens": [
    {
      "name": "Wheat & Gluten",
      "keywords": ["wheat", "flour", "gluten"],
      "detected": true,
      "matchedKeywords": ["wheat flour"],
      "severity": "high"
    }
  ],
  "category": null,
  "ingredientCount": 6,
  "ingredients": ["wheat flour", "sugar", "palm oil", "milk powder", "salt", "sodium benzoate"],
  "topIngredients": [
    { "name": "wheat flour", "count": 1, "percentage": 16.67 }
  ],
  "cleanLabelScore": 65,
  "analyzedAt": "2026-02-17T12:00:00Z"
}
```

---

### POST `/api/detect-allergens`

Allergen detection only.

**Request:**
```json
{ "ingredientText": "..." }
```

**Response (200):**
```json
{ "allergens": [ "...Allergen[]" ] }
```

---

### POST `/api/calculate-score`

Calculate clean label and health scores.

**Request:**
```json
{ "ingredientText": "..." }
```

**Response (200):**
```json
{
  "cleanLabelScore": 72,
  "healthRiskScore": null
}
```

---

## Planned Endpoints (Phase 2+)

| Method | Path                      | Description                              | Auth |
|--------|---------------------------|------------------------------------------|------|
| POST   | `/api/predict-category`   | ML category prediction                  | Yes  |
| POST   | `/api/get-similar-products` | Ingredient similarity search           | Yes  |
| GET    | `/api/additives`          | Additive knowledge base                 | Yes  |
| POST   | `/api/batch-analyze`      | Batch CSV analysis                      | Yes  |
| GET    | `/api/subscription/status` | Check Stripe subscription              | Yes  |
| POST   | `/api/subscription/create` | Create Stripe checkout session         | Yes  |
